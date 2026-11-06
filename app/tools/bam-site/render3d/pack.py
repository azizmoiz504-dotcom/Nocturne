# crop the rendered frames of each item to one shared box, bake a soft shadow, and pack them into a sprite sheet
import sys, os, glob, json
from PIL import Image, ImageFilter
src, dst = sys.argv[1], sys.argv[2]
MAX = int(sys.argv[3]) if len(sys.argv) > 3 else 460
items = sys.argv[4].split(',') if len(sys.argv) > 4 else 'cone light tape shovel hessian gloves goggles'.split()
os.makedirs(dst, exist_ok=True)
meta = {}
for it in items:
    fs = sorted(glob.glob(os.path.join(src, it + '_*.png')))
    if not fs: continue
    ims = [Image.open(f).convert('RGBA') for f in fs]
    box = None
    for im in ims:
        b = im.getchannel('A').point(lambda v: 255 if v > 6 else 0).getbbox()
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    w, h = box[2] - box[0], box[3] - box[1]
    pad = int(max(w, h) * .07)
    k = MAX / (max(w, h) + 2 * pad)
    fw, fh = round((w + 2 * pad) * k), round((h + 2 * pad) * k)
    cols = 7 if len(ims) >= 14 else len(ims); rows = -(-len(ims) // cols)
    sheet = Image.new('RGBA', (cols * fw, rows * fh), (0, 0, 0, 0))
    for n, im in enumerate(ims):
        c = Image.new('RGBA', (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
        c.alpha_composite(im.crop(box), (pad, pad))
        c = c.resize((fw, fh), Image.LANCZOS)
        # soft navy shadow below, from the item's own outline
        a = c.getchannel('A')
        sh = Image.new('RGBA', c.size, (11, 31, 85, 0))
        sa = a.filter(ImageFilter.GaussianBlur(fw * .022)).point(lambda v: int(v * .30))
        sh.putalpha(Image.new('L', c.size, 0)); tmp = Image.new('L', c.size, 0); tmp.paste(sa, (0, int(fh * .025))); sh.putalpha(tmp)
        out = Image.new('RGBA', c.size, (0, 0, 0, 0)); out.alpha_composite(sh); out.alpha_composite(c)
        sheet.paste(out, ((n % cols) * fw, (n // cols) * fh))
    fn = os.path.join(dst, 'spin-%s.webp' % it)
    sheet.save(fn, 'WEBP', quality=80, method=6, alpha_quality=80)
    meta[it] = {'n': len(ims), 'cols': cols, 'rows': rows, 'ar': round(fh / fw, 4)}
    print(it, sheet.size, (fw, fh), os.path.getsize(fn) // 1024, 'KB')
print(json.dumps(meta))
