How the 7 safety items on the BAM site are made (v3/static/img/spin-*.webp)

1. pip install bpy (Blender as a Python module), and put in dl/: the studio light studio_small_08_1k.hdr
   and the garden_gloves_01 1k glTF from Poly Haven (CC0; the glove shape only, recoloured to BAM's navy dotted glove).
2. python items.py ITEM frames 28 SIZE 96   (ITEM = cone light tape shovel hessian gloves goggles2 [the glasses on the site; rename frames to goggles_*]; SIZE 640, shovel 1000, hessian 720)
3. python pack.py frames sprites 460  (then shovel at 900, hessian,gloves at 400), copy sprites/spin-*.webp to v3/static/img/
   and paste the printed sizes into SPR in v3/static/hw3d.js.
