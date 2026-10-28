/* Runs on GitHub (.github/workflows/editor-upload.yml) when the product editor's "Upload to website" button puts a
   changes file in edits/inbox/. For each file, oldest first: tidy and check it (js/edit-check.js), apply it
   (tools/apply-edits.js, which also rebuilds the product pages and small photos) and write the result to
   edits/status/<id>.json, which the editor shows. Then the site is published to gh-pages the same way it is
   published by hand (git archive of this branch). A file that can't be applied changes nothing on the website.
   Try it without pushing:  node tools/publish-upload.js --no-push */
const fs = require('fs'), os = require('os'), path = require('path'), vm = require('vm'), { execFileSync } = require('child_process');
const BRANCH = 'claude/website-changes-9vx8yk', INBOX = 'edits/inbox', STATUS = 'edits/status';
const PUSH = !process.argv.includes('--no-push');
const run = (cmd, args, opt) => execFileSync(cmd, args, Object.assign({ encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }, opt));
const git = (...a) => run('git', a).trim();
const Check = require('../js/edit-check.js');
const site = () => { const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync('js/data.js', 'utf8'), ctx); return ctx.window; };
// the same list fingerprint edit.html and apply-edits.js use
const fingerprint = cats => (s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h); })(JSON.stringify(cats));
const total = W => W.FT_CATS.reduce((a, c) => a + c.items.length, 0);

class Refused extends Error {}
// apply-edits.js speaks to Claude; the editor shows these words to the person who pressed the button
function plain(err) {
  const msg = ((String(err.stderr || '').match(/Error: (.+)/) || [])[1] || err.message || String(err)).trim();
  if (/older website product list/.test(msg)) return 'The website list was changed after you opened the editor (someone else uploaded first), so your changes were NOT uploaded: they would undo the other changes. Press "Save changes file" and send the file to Claude.';
  if (/"older changes" file/.test(msg)) return 'These are older changes the editor put aside. Send them to Claude instead.';
  let m = msg.replace(/\s*(Check the file, then |Merge it by hand, then )?run with --force\.?/g, '').trim();
  if (!/[.!?)]$/.test(m)) m += '.';
  return 'Your changes could not be put on the website: ' + m + ' Nothing on the website changed.';
}

const files = fs.existsSync(INBOX) ? fs.readdirSync(INBOX).filter(f => /^[\w-]+\.json$/.test(f)).sort() : [];
if (!files.length) { console.log('No uploads waiting'); process.exit(0); }
git('config', 'user.name', 'Fakhri product editor');
git('config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com');
// the small photos already in the branch are up to date; this makes tools/thumbs.py only make copies of new photos
// (a fresh checkout gives every file a random-order time, which would remake all of them)
(function touch(d) { if (!fs.existsSync(d)) return; const now = new Date(); for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) touch(p); else fs.utimesSync(p, now, now); } })('assets/thumbs');

const done = [];
for (const f of files) {
  const id = f.replace(/\.json$/, ''), file = path.join(INBOX, f);
  const st = { id, at: new Date().toISOString(), ok: false };
  try {
    let up;
    try { up = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { throw new Refused('The upload was not a readable changes file. Nothing on the website changed.'); }
    if (!up || up.kind !== 'fakhri-product-edits' || !Array.isArray(up.cats)) throw new Refused('The upload was not a product changes file. Nothing on the website changed.');
    const r = Check.run(up, site().FT_CATS);
    if (r.errors.length) throw new Refused(r.errors.join(' ') + ' Nothing on the website changed.');
    const tmp = path.join(os.tmpdir(), id + '.json');
    fs.writeFileSync(tmp, JSON.stringify(r.file));
    try { process.stdout.write(run(process.execPath, ['tools/apply-edits.js', tmp])); } catch (e) { process.stdout.write(String(e.stdout || '')); process.stderr.write(String(e.stderr || '')); throw new Refused(plain(e)); }
    const W = site();
    if (/asbestos/i.test(JSON.stringify(W.FT_CATS))) throw new Refused('Asbestos was found in the product list, so nothing was put on the website. Tell Claude.');
    // a new product list gets a new version, so browsers load it instead of an old copy
    try { git('diff', '--quiet', '--', 'js/data.js'); } catch (e) {
      const ix = fs.readFileSync('index.html', 'utf8');
      fs.writeFileSync('index.html', ix.replace(/js\/data\.js\?v=(\d+)/, (m, v) => 'js/data.js?v=' + (+v + 1)));
    }
    Object.assign(st, { ok: true, products: total(W), categories: W.FT_CATS.length, photos: Object.keys(up.images || {}).length, ver: fingerprint(W.FT_CATS), fixes: r.fixes, warnings: r.warnings });
    console.log('Applied', id + ':', st.products, 'products,', st.photos, 'new photos,', r.fixes.length, 'tidied');
  } catch (e) {
    // put everything back as it was (photos apply-edits may already have saved, half-written pages)
    git('reset', '-q', '--hard'); git('clean', '-qfd', '--', 'assets', 'js', 'products', 'services', 'guides', 'ar');
    st.error = e instanceof Refused ? e.message : 'Something went wrong while putting your changes on the website (' + (e.message || e) + '). Nothing on the website changed. Tell Claude.';
    console.log('Not applied', id + ':', st.error);
  }
  fs.mkdirSync(STATUS, { recursive: true });
  fs.writeFileSync(path.join(STATUS, id + '.json'), JSON.stringify(st, null, 1) + '\n');
  git('rm', '-q', file);
  git('add', '-A');
  git('commit', '-q', '-m', st.ok ? 'Product editor upload ' + id + ': ' + st.products + ' products, ' + st.photos + ' new photos' : 'Product editor upload ' + id + ' not applied');
  done.push(st);
}

function publish() {
  const W = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gh-pages-')), 'site');
  git('fetch', '-q', 'origin', 'gh-pages');
  git('worktree', 'add', '-q', '-f', '-B', 'gh-pages-publish', W, 'origin/gh-pages');
  run('git', ['rm', '-rq', '.'], { cwd: W });
  execFileSync('bash', ['-c', 'git archive HEAD | tar -x -C "$1"', 'bash', W]);
  fs.rmSync(path.join(W, 'README.txt'), { force: true });
  run('git', ['add', '-A'], { cwd: W });
  try { run('git', ['diff', '--cached', '--quiet'], { cwd: W }); console.log('gh-pages already up to date'); return; } catch (e) { /* there are changes */ }
  run('git', ['commit', '-q', '-m', 'Publish: product editor upload ' + done.filter(s => s.ok).map(s => s.id).join(', ')], { cwd: W });
  if (PUSH) run('git', ['push', '-q', 'origin', 'gh-pages-publish:gh-pages'], { cwd: W });
  console.log('Published to gh-pages', run('git', ['rev-parse', '--short', 'HEAD'], { cwd: W }).trim());
}
if (done.some(s => s.ok)) {
  try { publish(); } catch (e) {
    console.error('Publishing failed:', e.message, String(e.stderr || ''));
    // nothing went live: keep the website list as it was and tell the editor, so the person can simply upload again
    git('reset', '-q', '--hard', 'origin/' + BRANCH);
    fs.mkdirSync(STATUS, { recursive: true });
    for (const s of done) {
      const st = s.ok ? { id: s.id, at: new Date().toISOString(), ok: false, error: 'GitHub could not update the website just now, so nothing changed. Please press "Upload to website" again in a few minutes.' } : s;
      fs.writeFileSync(path.join(STATUS, s.id + '.json'), JSON.stringify(st, null, 1) + '\n');
      if (fs.existsSync(path.join(INBOX, s.id + '.json'))) git('rm', '-q', path.join(INBOX, s.id + '.json'));
    }
    git('add', '-A'); git('commit', '-q', '-m', 'Product editor upload not published (GitHub problem)');
    process.exitCode = 1;
  }
}
// the editor reads the result from this branch
for (let i = 0; PUSH; i++) {
  try { git('push', '-q', 'origin', 'HEAD:' + BRANCH); break; } catch (e) { if (i === 3) throw e; git('pull', '-q', '--rebase', 'origin', BRANCH); }
}
