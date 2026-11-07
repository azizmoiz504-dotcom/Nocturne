# Builds the private browser preview of the sales app (a claude.ai artifact, never a public page: it carries
# the Bait Al Maqdis and Modern Electric prices) from app/build/apk/assets/www, made by app/build.sh --www. Product photos go into
# a few "photo pack" scripts (an artifact holds a few hundred files at most); everything else is copied as it is.
# usage: python3 -I app/tools/preview/mkpreview.py <www> <out>, then copy preview.js and sales-app-preview.html into <out>
# and publish sales-app-preview.html with every other file in <out>.
import base64, io, json, os, re, shutil, sys
from PIL import Image

WWW, OUT = sys.argv[1], sys.argv[2]
if os.path.exists(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)

skip = ('p/', 'bam/p/', 'me/p/')
files = []
for root, _, fs in os.walk(WWW):
    for f in fs:
        rel = os.path.relpath(os.path.join(root, f), WWW)
        if rel.startswith(skip) or rel in ('index.html', 'photos.txt'):
            continue
        dst = os.path.join(OUT, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy(os.path.join(WWW, rel), dst)
        files.append(rel)

# on a computer the preview shows the app in a phone-sized frame, so the wider-screen layouts must not switch on
css = os.path.join(OUT, 'app.css')
t = open(css).read()
t2 = re.sub(r'@media \(min-width:\d+px\)\{[^\n]*\}\}\n', '', t)
assert t2 != t and '@media (min-width' not in t2
open(css, 'w').write(t2)

# photo packs: about 4 MB each, smaller photos than the phone gets (it is a preview)
photos = []
for top in ('p', 'bam/p', 'me/p'):
    for root, _, fs in os.walk(os.path.join(WWW, top)):
        for f in sorted(fs):
            photos.append(os.path.relpath(os.path.join(root, f), WWW))
photos.sort(key=lambda p: (not p.startswith(('bam/', 'me/')), p))
packs, cur, size = [], {}, 0
for rel in photos:
    im = Image.open(os.path.join(WWW, rel))
    im.thumbnail((640, 900))
    buf = io.BytesIO()
    if im.mode in ('RGBA', 'LA', 'P'):
        bg = Image.new('RGB', im.size, (255, 255, 255)); bg.paste(im.convert('RGBA'), mask=im.convert('RGBA').split()[-1]); im = bg
    im.convert('RGB').save(buf, 'JPEG', quality=74, optimize=True, progressive=True)
    url = 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
    cur[rel] = url; size += len(url)
    if size > 2_500_000:
        packs.append(cur); cur, size = {}, 0
if cur:
    packs.append(cur)
names, where = [], {}
for i, pk in enumerate(packs):
    for k in pk:
        where[k] = i
    n = f'photos-{i + 1}.js'
    with open(os.path.join(OUT, n), 'w') as f:
        f.write('window.__IMG=window.__IMG||{};Object.assign(window.__IMG,' + json.dumps(pk, separators=(',', ':')) + ');window.__packLoaded&&window.__packLoaded();\n')
    names.append(n)
with open(os.path.join(OUT, 'packs.js'), 'w') as f:
    f.write('window.__PACKS=' + json.dumps(names) + ';window.__WHERE=' + json.dumps(where, separators=(',', ':')) + ';\n')
print(len(files), 'files,', len(photos), 'photos in', len(names), 'packs:', ', '.join(f'{n} {os.path.getsize(os.path.join(OUT, n)) / 1e6:.1f} MB' for n in names))
