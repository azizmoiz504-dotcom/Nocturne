# Blender (bpy) models of BAM's 7 safety items, matched to BAM's own product photos.
# usage: python items.py ITEM OUTDIR [frames] [size] [samples]
import bpy, bmesh, math, sys, os
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
item = sys.argv[1]; outdir = sys.argv[2]
FR = int(sys.argv[3]) if len(sys.argv) > 3 else 1
SIZE = int(sys.argv[4]) if len(sys.argv) > 4 else 360
SAMPLES = int(sys.argv[5]) if len(sys.argv) > 5 else 48

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 8; sc.cycles.transmission_bounces = 8; sc.cycles.transparent_max_bounces = 8
sc.render.film_transparent = True
sc.cycles.film_transparent_glass = True
sc.view_settings.view_transform = 'Khronos PBR Neutral'
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'

# ---------- world + lights ----------
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
nt = w.node_tree; bg = nt.nodes['Background']
env = nt.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(os.path.join(HERE, 'dl/studio_small_08_1k.hdr'))
nt.links.new(env.outputs[0], bg.inputs[0]); bg.inputs[1].default_value = 0.55

def area(name, loc, energy, size, color=(1, 1, 1)):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = energy; l.size = size; l.color = color
    o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.location = loc
    d = Vector((0, 0, 0)) - Vector(loc); o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return o
area('key', (-2.2, -2.6, 2.8), 300, 2.2, (1, .97, .93))
area('fill', (2.8, -2.0, 0.6), 70, 3.0, (.85, .9, 1))
area('rim', (1.2, 2.6, 2.2), 260, 1.5, (.9, .95, 1))

# ---------- helpers ----------
def mat(name, color, rough=.4, metal=0., **kw):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*color, 1); p.inputs['Roughness'].default_value = rough; p.inputs['Metallic'].default_value = metal
    for k, v in kw.items(): p.inputs[k].default_value = v
    return m

def N(m, t, **kw):
    n = m.node_tree.nodes.new(t)
    for k, v in kw.items(): setattr(n, k, v)
    return n
def L(m, a, b): m.node_tree.links.new(a, b)
def P(m): return m.node_tree.nodes['Principled BSDF']

def obj(name, me):
    o = bpy.data.objects.new(name, me); sc.collection.objects.link(o); return o

def lathe(name, prof, seg=96, cap_top=True, cap_bot=True):
    """prof: list of (r, z) bottom to top; makes a smooth surface of revolution"""
    bm = bmesh.new(); rings = []
    for r, z in prof:
        ring = [bm.verts.new((r * math.cos(2 * math.pi * i / seg), r * math.sin(2 * math.pi * i / seg), z)) for i in range(seg)]
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for i in range(seg):
            bm.faces.new((a[i], a[(i + 1) % seg], b[(i + 1) % seg], b[i]))
    if cap_bot and prof[0][0] > 0: bm.faces.new(list(reversed(rings[0])))
    if cap_top and prof[-1][0] > 0: bm.faces.new(rings[-1])
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for f in me.polygons: f.use_smooth = True
    return obj(name, me)

def smooth(o, lvl=2, ang=None):
    m = o.modifiers.new('sub', 'SUBSURF'); m.levels = lvl; m.render_levels = lvl
    return o

def bevel(o, w=.003, seg=3):
    m = o.modifiers.new('bev', 'BEVEL'); m.width = w; m.segments = seg; m.limit_method = 'ANGLE'
    return o

def solid(o, t):
    m = o.modifiers.new('sol', 'SOLIDIFY'); m.thickness = t; m.offset = 0
    return o

def tube(name, pts, r, seg=24, mat_=None):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r; cu.bevel_resolution = 6; cu.use_fill_caps = True
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for p_, c in zip(sp.points, pts): p_.co = (*c, 1)
    sp.type = 'NURBS'; sp.order_u = 3; sp.use_endpoint_u = True; sp.resolution_u = 24
    o = obj(name, cu)
    if mat_: cu.materials.append(mat_)
    return o

def assign(o, m): o.data.materials.clear(); o.data.materials.append(m)

def zcoord_mix(m, stops, colors_key='Base Color'):
    pass

root = bpy.data.objects.new('root', None); sc.collection.objects.link(root)
def parent(*os_):
    for o in os_: o.parent = root

# ======================================================================
def make_cone():
    H = .75
    body = lathe('cone', [(.135, .035), (.13, .06), (.112, .2), (.075, .42), (.04, .62), (.027, .72), (.022, H), (0, H)], seg=128)
    m = mat('cone', (.78, .03, .015), .32, **{"Coat Weight": 0.0})
    # white reflective bands by height
    t = N(m, 'ShaderNodeTexCoord'); sep = N(m, 'ShaderNodeSeparateXYZ'); L(m, t.outputs['Object'], sep.inputs[0])
    ramp = N(m, 'ShaderNodeValToRGB'); L(m, sep.outputs['Z'], ramp.inputs[0])
    cr = ramp.color_ramp; cr.interpolation = 'CONSTANT'
    cr.elements[0].position = 0; cr.elements[0].color = (0, 0, 0, 1)
    cr.elements[1].position = .30; cr.elements[1].color = (1, 1, 1, 1)
    e = cr.elements.new(.52); e.color = (0, 0, 0, 1)
    mixc = N(m, 'ShaderNodeMix', data_type='RGBA'); L(m, ramp.outputs[0], mixc.inputs[0])
    mixc.inputs[6].default_value = (.78, .03, .015, 1); mixc.inputs[7].default_value = (.86, .87, .88, 1)
    L(m, mixc.outputs[2], P(m).inputs['Base Color'])
    # band: micro-prism sparkle via noise bump
    nz = N(m, 'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 900
    bm_ = N(m, 'ShaderNodeBump'); bm_.inputs['Strength'].default_value = .12; L(m, nz.outputs[0], bm_.inputs['Height'])
    mr = N(m, 'ShaderNodeMath', operation='MULTIPLY'); L(m, ramp.outputs[0], mr.inputs[0]); mr.inputs[1].default_value = 1
    L(m, bm_.outputs[0], P(m).inputs['Normal'])
    rr = N(m, 'ShaderNodeMapRange'); L(m, ramp.outputs[0], rr.inputs[0]); rr.inputs[3].default_value = .32; rr.inputs[4].default_value = .18
    L(m, rr.outputs[0], P(m).inputs['Roughness'])
    assign(body, m)
    # black rubber base: chamfered square, slightly raised round boss
    bpy.ops.mesh.primitive_cube_add(size=1)
    base = bpy.context.object; base.scale = (.36, .36, .04); base.location.z = .02
    bpy.ops.object.transform_apply(scale=True)
    bv = base.modifiers.new('b', 'BEVEL'); bv.width = .035; bv.segments = 1; bv.affect = 'EDGES'
    # only the vertical edges: bevel by angle limited, then small round bevel
    bv2 = bevel(base, .006, 3)
    boss = lathe('boss', [(.17, .04), (.165, .052), (.14, .06), (.135, .06)], seg=96)
    rub = mat('rubber', (.018, .018, .02), .62)
    nz = N(rub, 'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 300
    b2 = N(rub, 'ShaderNodeBump'); b2.inputs['Strength'].default_value = .2; L(rub, nz.outputs[0], b2.inputs['Height']); L(rub, b2.outputs[0], P(rub).inputs['Normal'])
    assign(base, rub); assign(boss, rub)
    for f in base.data.polygons: f.use_smooth = False
    parent(body, base, boss)
    return dict(axis='Z', sway=200, tilt=14, center=(0, 0, .37))

def make_light():
    yel = mat('yel', (.95, .72, .0), .38)
    amb_body = mat('ambB', (1, .45, .0), .3, **{'Transmission Weight': .35, 'Subsurface Weight': .3, 'Subsurface Radius': (1, .4, .1)})
    # yellow cone stand
    stand = lathe('stand', [(.072, 0), (.07, .01), (.047, .2), (.045, .205), (0, .205)], seg=96)
    assign(stand, yel)
    neck = lathe('neck', [(.035, .2), (.033, .26), (.03, .27), (0, .27)], seg=64); assign(neck, amb_body)
    # round housing, axis along -Y (facing the camera)
    R = .105; hz = .37
    hous = lathe('hous', [(0, -.03), (R * .96, -.03), (R, -.022), (R, .02), (R * .97, .028), (0, .028)], seg=128)
    hous.rotation_euler.x = math.pi / 2; hous.location = (0, 0, hz); assign(hous, amb_body)
    # front fresnel lens: dome with rings
    lens = lathe('lens', [(R * .97, 0), (R * .9, .006)] + [(R * .9 * (1 - i / 12), .006 + .006 * math.sin(i / 12 * math.pi / 2)) for i in range(1, 13)], seg=128)
    lens.rotation_euler.x = math.pi / 2; lens.location = (0, -.03, hz)
    lm = mat('lens', (1, .55, .02), .12, **{'Transmission Weight': .75, 'IOR': 1.49, 'Emission Color': (1, .5, .0, 1), 'Emission Strength': .5})
    tc = N(lm, 'ShaderNodeTexCoord'); sep = N(lm, 'ShaderNodeSeparateXYZ'); L(lm, tc.outputs['Object'], sep.inputs[0])
    ln = N(lm, 'ShaderNodeVectorMath', operation='LENGTH'); cmb = N(lm, 'ShaderNodeCombineXYZ'); L(lm, sep.outputs[0], cmb.inputs[0]); L(lm, sep.outputs[1], cmb.inputs[1]); L(lm, cmb.outputs[0], ln.inputs[0])
    sw = N(lm, 'ShaderNodeMath', operation='MULTIPLY'); L(lm, ln.outputs['Value'], sw.inputs[0]); sw.inputs[1].default_value = 170
    sn = N(lm, 'ShaderNodeMath', operation='PINGPONG'); L(lm, sw.outputs[0], sn.inputs[0]); sn.inputs[1].default_value = 1
    bp = N(lm, 'ShaderNodeBump'); bp.inputs['Strength'].default_value = .8; L(lm, sn.outputs[0], bp.inputs['Height']); L(lm, bp.outputs[0], P(lm).inputs['Normal'])
    assign(lens, lm)
    # inner reflector (shiny) visible through the lens
    refl = lathe('refl', [(R * .85, 0), (0.02, .02), (0, .02)], seg=96); refl.rotation_euler.x = math.pi / 2; refl.location = (0, .0, hz)
    assign(refl, mat('refl', (1, .6, .15), .15, 1.0))
    # centre cap
    cap = lathe('cap', [(.03, 0), (.03, .006), (.022, .016), (0, .019)], seg=64); cap.rotation_euler.x = math.pi / 2; cap.location = (0, -.04, hz)
    assign(cap, mat('capm', (1, .62, .04), .25, **{'Transmission Weight': .4}))
    # screws
    sm = mat('screw', (.7, .7, .72), .25, 1.)
    for a in (45, 135, 225, 315):
        s = lathe('scr', [(.0045, 0), (.0045, .002), (0, .004)], seg=24); s.rotation_euler.x = math.pi / 2
        s.location = (math.cos(math.radians(a)) * R * .82, -.036, hz + math.sin(math.radians(a)) * R * .82); assign(s, sm)
    # top: solar box
    bpy.ops.mesh.primitive_cube_add(size=1); box = bpy.context.object; box.scale = (.13, .07, .045); box.location = (0, 0, hz + R + .012)
    bpy.ops.object.transform_apply(scale=True); bevel(box, .008, 4); assign(box, amb_body)
    bpy.ops.mesh.primitive_cube_add(size=1); pan = bpy.context.object; pan.scale = (.1, .05, .004); pan.location = (0, 0, hz + R + .035)
    bpy.ops.object.transform_apply(scale=True); bevel(pan, .002, 2)
    pm = mat('panel', (.02, .03, .08), .12, .3)
    br = N(pm, 'ShaderNodeTexBrick'); br.inputs['Scale'].default_value = 40; br.inputs['Mortar Size'].default_value = .02; br.offset = 0
    br.inputs['Color1'].default_value = (.02, .04, .12, 1); br.inputs['Color2'].default_value = (.03, .05, .14, 1); br.inputs['Mortar'].default_value = (.6, .6, .65, 1)
    L(pm, br.outputs[0], P(pm).inputs['Base Color']); assign(pan, pm)
    # black wire handle
    hb = mat('handle', (.01, .01, .012), .35)
    ht = hz + R + .04
    tube('hand', [(-.05, 0, ht), (-.055, 0, ht + .05), (-.03, 0, ht + .09), (-.015, 0, ht + .095), (-.01, 0, ht + .11), (.01, 0, ht + .11), (.015, 0, ht + .095), (.03, 0, ht + .09), (.055, 0, ht + .05), (.05, 0, ht)], .0035, mat_=hb)
    for o in bpy.data.objects:
        if o.type in ('MESH', 'CURVE') and o.parent is None: o.parent = root
    return dict(axis='Z', sway=70, tilt=6, center=(0, 0, .27))

def stripe_mat(name, k=14.0):
    """red/white diagonal stripes in UV space (u along the tape)"""
    m = mat(name, (1, 1, 1), .3)
    tc = N(m, 'ShaderNodeTexCoord'); sep = N(m, 'ShaderNodeSeparateXYZ'); L(m, tc.outputs['UV'], sep.inputs[0])
    add = N(m, 'ShaderNodeMath', operation='ADD'); L(m, sep.outputs[0], add.inputs[0]); L(m, sep.outputs[1], add.inputs[1])
    mul = N(m, 'ShaderNodeMath', operation='MULTIPLY'); L(m, add.outputs[0], mul.inputs[0]); mul.inputs[1].default_value = k
    fr = N(m, 'ShaderNodeMath', operation='FRACT'); L(m, mul.outputs[0], fr.inputs[0])
    st = N(m, 'ShaderNodeMath', operation='GREATER_THAN'); L(m, fr.outputs[0], st.inputs[0]); st.inputs[1].default_value = .5
    mx = N(m, 'ShaderNodeMix', data_type='RGBA'); L(m, st.outputs[0], mx.inputs[0])
    mx.inputs[6].default_value = (.92, .92, .92, 1); mx.inputs[7].default_value = (.82, .02, .03, 1)
    L(m, mx.outputs[2], P(m).inputs['Base Color'])
    return m

def make_tape():
    # roll axis along Y (faces the camera), width 75mm
    Ro, Ri, Wd = .062, .04, .075
    seg = 128
    bm = bmesh.new(); uv = bm.loops.layers.uv.new()
    # outer surface (u around, v across width), scaled so stripes match the tail
    def ring(r, y): return [bm.verts.new((r * math.cos(2 * math.pi * i / seg), y, r * math.sin(2 * math.pi * i / seg))) for i in range(seg + 1)]
    a = ring(Ro, -Wd / 2); b = ring(Ro, Wd / 2)
    circ = 2 * math.pi * Ro
    for i in range(seg):
        f = bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
        for lp, (u, v) in zip(f.loops, ((i / seg * circ, 0), ((i + 1) / seg * circ, 0), ((i + 1) / seg * circ, Wd), (i / seg * circ, Wd))):
            lp[uv].uv = (u / Wd, v / Wd)
    me = bpy.data.meshes.new('roll'); bm.to_mesh(me); bm.free()
    for f in me.polygons: f.use_smooth = True
    roll = obj('roll', me)
    sm = stripe_mat('stripe', 1.6); assign(roll, sm)
    # side faces: wound layers, red/white edges
    side = mat('side', (.9, .88, .88), .45)
    tc = N(side, 'ShaderNodeTexCoord'); sep = N(side, 'ShaderNodeSeparateXYZ'); L(side, tc.outputs['Object'], sep.inputs[0])
    cmb = N(side, 'ShaderNodeCombineXYZ'); L(side, sep.outputs[0], cmb.inputs[0]); L(side, sep.outputs[2], cmb.inputs[1])
    ln = N(side, 'ShaderNodeVectorMath', operation='LENGTH'); L(side, cmb.outputs[0], ln.inputs[0])
    w_ = N(side, 'ShaderNodeTexWave', wave_type='RINGS'); w_.inputs['Scale'].default_value = 1
    mm = N(side, 'ShaderNodeMath', operation='MULTIPLY'); L(side, ln.outputs['Value'], mm.inputs[0]); mm.inputs[1].default_value = 900
    sn = N(side, 'ShaderNodeMath', operation='SINE'); L(side, mm.outputs[0], sn.inputs[0])
    nz = N(side, 'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 40
    ad = N(side, 'ShaderNodeMath', operation='ADD'); L(side, sn.outputs[0], ad.inputs[0]); L(side, nz.outputs[0], ad.inputs[1])
    mx = N(side, 'ShaderNodeMix', data_type='RGBA'); L(side, nz.outputs[0], mx.inputs[0])
    mx.inputs[6].default_value = (.95, .93, .93, 1); mx.inputs[7].default_value = (.85, .45, .45, 1)
    L(side, mx.outputs[2], P(side).inputs['Base Color'])
    bp = N(side, 'ShaderNodeBump'); bp.inputs['Strength'].default_value = .25; L(side, ad.outputs[0], bp.inputs['Height']); L(side, bp.outputs[0], P(side).inputs['Normal'])
    for y in (-Wd / 2, Wd / 2):
        bm = bmesh.new()
        o_ = [bm.verts.new((Ro * math.cos(2 * math.pi * i / seg), y, Ro * math.sin(2 * math.pi * i / seg))) for i in range(seg)]
        i_ = [bm.verts.new((Ri * math.cos(2 * math.pi * i / seg), y, Ri * math.sin(2 * math.pi * i / seg))) for i in range(seg)]
        for i in range(seg):
            j = (i + 1) % seg
            bm.faces.new((o_[i], o_[j], i_[j], i_[i]) if y > 0 else (i_[i], i_[j], o_[j], o_[i]))
        me = bpy.data.meshes.new('side'); bm.to_mesh(me); bm.free(); s = obj('side', me); assign(s, side)
    # cardboard core
    core = lathe('core', [(Ri, -Wd / 2 - .001), (Ri, Wd / 2 + .001)], seg=96, cap_top=False, cap_bot=False)
    core.rotation_euler.x = math.pi / 2; solid(core, .004)
    cm = mat('card', (.55, .42, .28), .8)
    nz = N(cm, 'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 120; bp = N(cm, 'ShaderNodeBump'); bp.inputs['Strength'].default_value = .15
    L(cm, nz.outputs[0], bp.inputs['Height']); L(cm, bp.outputs[0], P(cm).inputs['Normal']); assign(core, cm)
    # loose tail coming off the bottom front, curling down and away
    bm = bmesh.new(); uv = bm.loops.layers.uv.new()
    n = 60; pts = []
    th0 = -math.pi / 2 - .35   # leaves the roll at the bottom-front
    for k in range(n + 1):
        s = k / n * .2
        x = Ro * math.cos(th0) - s * .55 - .03 * math.sin(s * 9)
        z = Ro * math.sin(th0) - s * .85 + .015 * math.sin(s * 14)
        pts.append((x, z, s))
    rows = []
    for x, z, s in pts:
        tw = math.sin(s * 7) * .25
        rows.append([bm.verts.new((x + math.sin(tw) * (w * Wd / 2) * .3, w * Wd / 2 * math.cos(tw), z + math.sin(tw) * w * Wd / 2 * .2)) for w in (-1, 1)])
    for k in range(n):
        f = bm.faces.new((rows[k][0], rows[k + 1][0], rows[k + 1][1], rows[k][1]))
        for lp, (u, v) in zip(f.loops, ((pts[k][2], 0), (pts[k + 1][2], 0), (pts[k + 1][2], Wd), (pts[k][2], Wd))):
            lp[uv].uv = (-u / Wd, v / Wd)
    me = bpy.data.meshes.new('tail'); bm.to_mesh(me); bm.free()
    for f in me.polygons: f.use_smooth = True
    tail = obj('tail', me); solid(tail, .0006); smooth(tail, 1); assign(tail, sm)
    for o in bpy.data.objects:
        if o.type == 'MESH' and o.parent is None: o.parent = root
    return dict(axis='Z', sway=60, tilt=16, center=None, base_rot=38)

def make_shovel():
    # lies along X: blade at -X, grip at +X; turns around its own length
    steel = mat('steel', (.36, .37, .39), .42, 1.)
    nz = N(steel, 'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 60; nz.inputs['Detail'].default_value = 8
    rr = N(steel, 'ShaderNodeMapRange'); L(steel, nz.outputs[0], rr.inputs[0]); rr.inputs[3].default_value = .3; rr.inputs[4].default_value = .55
    L(steel, rr.outputs[0], P(steel).inputs['Roughness'])
    # blade: round point, dished
    bm = bmesh.new(); nu, nv = 40, 40
    BL, BW = .29, .235
    grid = []
    for i in range(nu + 1):
        u = i / nu   # 0 = tip, 1 = top edge
        row = []
        for j in range(nv + 1):
            v = j / nv * 2 - 1
            # width profile: pointed round tip, straight sides, step at the top
            half = BW / 2 * (math.sin(min(1, u / .62) * math.pi / 2) ** .7)
            x = -BL + u * BL
            y = v * half
            z = .035 * (v * v) * (.4 + .6 * u) + .012 * (1 - u)
            row.append(bm.verts.new((x, y, z)))
        grid.append(row)
    for i in range(nu):
        for j in range(nv):
            bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
    me = bpy.data.meshes.new('blade'); bm.to_mesh(me); bm.free()
    for f in me.polygons: f.use_smooth = True
    blade = obj('blade', me); solid(blade, .003); assign(blade, steel)
    # turned-over steps at the top of the blade
    for s in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(size=1); st = bpy.context.object
        st.scale = (.018, .07, .004); st.location = (.005, s * .075, .043); st.rotation_euler.x = s * -.35
        bpy.ops.object.transform_apply(scale=True); bevel(st, .0015, 2); assign(st, steel)
    # frog: tapered socket from blade to handle, with the ridge running down the blade
    frog = lathe('frog', [(.0, -.0), (.006, .0), (.02, .04), (.021, .2), (.023, .22), (0, .22)], seg=48)
    frog.rotation_euler.y = math.pi / 2; frog.location = (-.12, 0, .028); frog.scale = (1, 1, 1)
    sx = frog.modifiers.new('flat', 'SIMPLE_DEFORM'); sx.deform_method = 'TAPER'
    assign(frog, steel)
    ferr = lathe('ferr', [(.0215, 0), (.0215, .03), (0, .03)], seg=48); ferr.rotation_euler.y = math.pi / 2; ferr.location = (.095, 0, .028)
    assign(ferr, mat('ferr', (.85, .86, .88), .18, 1.))
    # yellow fiberglass handle and black grip
    hl = 1.0
    hand = lathe('hand', [(.017, 0), (.017, hl), (0, hl)], seg=48, cap_bot=False); hand.rotation_euler.y = math.pi / 2; hand.location = (.12, 0, .028)
    fy = mat('fibre', (.98, .78, .02), .28, **{"Coat Weight": .6})
    nz = N(fy, 'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 25; mp = N(fy, 'ShaderNodeMapping'); tc = N(fy, 'ShaderNodeTexCoord')
    mp.inputs['Scale'].default_value = (1, 1, .05); L(fy, tc.outputs['Object'], mp.inputs[0]); L(fy, mp.outputs[0], nz.inputs[0])
    bp = N(fy, 'ShaderNodeBump'); bp.inputs['Strength'].default_value = .08; L(fy, nz.outputs[0], bp.inputs['Height']); L(fy, bp.outputs[0], P(fy).inputs['Normal'])
    assign(hand, fy)
    grip = lathe('grip', [(.0, 0), (.019, .0), (.0205, .004), (.0205, .17), (.019, .178), (0, .18)], seg=48); grip.rotation_euler.y = math.pi / 2; grip.location = (.12 + hl - .17, 0, .028)
    assign(grip, mat('gripm', (.015, .015, .017), .55))
    parent(blade, frog, ferr, hand, grip, *[o for o in bpy.data.objects if o.name.startswith('Cube')])
    return dict(axis='X', sway=75, tilt=0, center=None, base_x=75)

def make_hessian():
    # a roll of hessian with a length unrolled toward the camera
    m = mat('jute', (.55, .40, .22), .85, **{'Sheen Weight': .6, 'Sheen Tint': (1, .9, .7, 1)})
    tc = N(m, 'ShaderNodeTexCoord')
    wa = N(m, 'ShaderNodeTexWave', wave_type='BANDS', bands_direction='X'); wa.inputs['Scale'].default_value = 34; wa.inputs['Distortion'].default_value = 3; wa.inputs['Detail Scale'].default_value = 4
    wb = N(m, 'ShaderNodeTexWave', wave_type='BANDS', bands_direction='Y'); wb.inputs['Scale'].default_value = 34; wb.inputs['Distortion'].default_value = 2; wb.inputs['Detail Scale'].default_value = 4
    L(m, tc.outputs['UV'], wa.inputs[0]); L(m, tc.outputs['UV'], wb.inputs[0])
    mu = N(m, 'ShaderNodeMath', operation='MULTIPLY'); L(m, wa.outputs[1], mu.inputs[0]); L(m, wb.outputs[1], mu.inputs[1])
    nz = N(m, 'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 9; nz.inputs['Detail'].default_value = 10; L(m, tc.outputs['UV'], nz.inputs[0])
    mx = N(m, 'ShaderNodeMix', data_type='RGBA'); L(m, mu.outputs[0], mx.inputs[0])
    mx.inputs[6].default_value = (.07, .04, .015, 1); mx.inputs[7].default_value = (.36, .23, .09, 1)
    mx2 = N(m, 'ShaderNodeMix', data_type='RGBA'); L(m, nz.outputs[0], mx2.inputs[0]); mx2.inputs[0].default_value = .5
    L(m, mx.outputs[2], mx2.inputs[6]); mx2.inputs[7].default_value = (.5, .37, .2, 1); mx2.blend_type = 'MULTIPLY'
    L(m, mx.outputs[2], P(m).inputs['Base Color'])
    bp = N(m, 'ShaderNodeBump'); bp.inputs['Strength'].default_value = .6; bp.inputs['Distance'].default_value = .002; L(m, mu.outputs[0], bp.inputs['Height']); L(m, bp.outputs[0], P(m).inputs['Normal'])
    R, Ln = .09, .5
    # roll along X
    bm = bmesh.new(); uv = bm.loops.layers.uv.new(); seg = 96; nx = 4
    rings = []
    for k in range(nx + 1):
        x = -Ln / 2 + Ln * k / nx
        rings.append([bm.verts.new((x, R * math.cos(2 * math.pi * i / seg), R * math.sin(2 * math.pi * i / seg))) for i in range(seg + 1)])
    for k in range(nx):
        for i in range(seg):
            f = bm.faces.new((rings[k][i], rings[k][i + 1], rings[k + 1][i + 1], rings[k + 1][i]))
            for lp, (u, v) in zip(f.loops, ((k / nx * Ln, i / seg * 2 * math.pi * R), (k / nx * Ln, (i + 1) / seg * 2 * math.pi * R), ((k + 1) / nx * Ln, (i + 1) / seg * 2 * math.pi * R), ((k + 1) / nx * Ln, i / seg * 2 * math.pi * R))):
                lp[uv].uv = (u * 2, v * 2)
    me = bpy.data.meshes.new('hroll'); bm.to_mesh(me); bm.free()
    for f in me.polygons: f.use_smooth = True
    roll = obj('hroll', me); assign(roll, m)
    # wound ends
    endm = mat('ends', (.45, .32, .17), .9)
    tc2 = N(endm, 'ShaderNodeTexCoord'); sep = N(endm, 'ShaderNodeSeparateXYZ'); L(endm, tc2.outputs['Object'], sep.inputs[0])
    cmb = N(endm, 'ShaderNodeCombineXYZ'); L(endm, sep.outputs[1], cmb.inputs[0]); L(endm, sep.outputs[2], cmb.inputs[1])
    ln = N(endm, 'ShaderNodeVectorMath', operation='LENGTH'); L(endm, cmb.outputs[0], ln.inputs[0])
    nz2 = N(endm, 'ShaderNodeTexNoise'); nz2.inputs['Scale'].default_value = 30
    ad = N(endm, 'ShaderNodeMath', operation='MULTIPLY_ADD'); L(endm, ln.outputs['Value'], ad.inputs[0]); ad.inputs[1].default_value = 400; L(endm, nz2.outputs[0], ad.inputs[2])
    sn = N(endm, 'ShaderNodeMath', operation='SINE'); L(endm, ad.outputs[0], sn.inputs[0])
    bp2 = N(endm, 'ShaderNodeBump'); bp2.inputs['Strength'].default_value = .5; L(endm, sn.outputs[0], bp2.inputs['Height']); L(endm, bp2.outputs[0], P(endm).inputs['Normal'])
    for x in (-Ln / 2, Ln / 2):
        e = lathe('end', [(R, 0), (R * .6, .004), (.022, .004), (.022, -.0)], seg=96)
        e.rotation_euler.y = math.pi / 2 * (1 if x > 0 else -1); e.location.x = x; assign(e, endm)
    # unrolled sheet: leaves the roll at the bottom front and lies in soft folds
    bm = bmesh.new(); uv = bm.loops.layers.uv.new(); n = 50; mrow = 20
    rows = []
    for k in range(n + 1):
        s = k / n
        ang = -math.pi / 2 + .0
        y = -s * .38
        z = -R + .0 - s * s * .05 + .012 * math.sin(s * 12)
        rows.append([(-Ln / 2 + Ln * j / mrow, y - .0, z + .006 * math.sin(j / mrow * 18 + s * 5) * s) for j in range(mrow + 1)])
    vv = [[bm.verts.new(p) for p in r] for r in rows]
    for k in range(n):
        for j in range(mrow):
            f = bm.faces.new((vv[k][j], vv[k][j + 1], vv[k + 1][j + 1], vv[k + 1][j]))
            for lp, (a_, b_) in zip(f.loops, ((j, k), (j + 1, k), (j + 1, k + 1), (j, k + 1))):
                lp[uv].uv = (a_ / mrow * Ln * 2, -b_ / n * .38 * 2)
    me = bpy.data.meshes.new('sheet'); bm.to_mesh(me); bm.free()
    for f in me.polygons: f.use_smooth = True
    sheet = obj('sheet', me); solid(sheet, .002); assign(sheet, m)
    # frayed edge threads at the end of the sheet
    parent(roll, sheet, *[o for o in bpy.data.objects if o.name.startswith('end')])
    return dict(axis='Z', sway=60, tilt=22, center=(0, -.12, -.03))

def make_gloves():
    bpy.ops.import_scene.gltf(filepath=os.path.join(HERE, 'dl/garden_gloves_01_1k.gltf'))
    gl = [o for o in bpy.context.selected_objects if o.type == 'MESH']
    img_n = bpy.data.images.load(os.path.join(HERE, 'dl/textures/garden_gloves_01_nor_gl_1k.jpg')); img_n.colorspace_settings.name = 'Non-Color'
    img_d = bpy.data.images.load(os.path.join(HERE, 'dl/textures/garden_gloves_01_diff_1k.jpg'))
    m = mat('knit', (.02, .035, .16), .85, **{'Sheen Weight': .25, 'Sheen Tint': (.5, .6, 1, 1)})
    tc = N(m, 'ShaderNodeTexCoord')
    tn = N(m, 'ShaderNodeTexImage'); tn.image = img_n; L(m, tc.outputs['UV'], tn.inputs[0])
    nm = N(m, 'ShaderNodeNormalMap'); L(m, tn.outputs[0], nm.inputs['Color']); nm.inputs['Strength'].default_value = 1.0
    td = N(m, 'ShaderNodeTexImage'); td.image = img_d; L(m, tc.outputs['UV'], td.inputs[0])
    # where the original glove had its rubber palm (dark), BAM's glove has blue PVC dots
    bw = N(m, 'ShaderNodeRGBToBW'); L(m, td.outputs[0], bw.inputs[0])
    msk = N(m, 'ShaderNodeMath', operation='LESS_THAN'); L(m, bw.outputs[0], msk.inputs[0]); msk.inputs[1].default_value = .16
    vo = N(m, 'ShaderNodeTexVoronoi'); vo.inputs['Scale'].default_value = 90; vo.inputs['Randomness'].default_value = 0; L(m, tc.outputs['UV'], vo.inputs[0])
    dot = N(m, 'ShaderNodeMath', operation='LESS_THAN'); L(m, vo.outputs['Distance'], dot.inputs[0]); dot.inputs[1].default_value = .22
    both = N(m, 'ShaderNodeMath', operation='MULTIPLY'); L(m, msk.outputs[0], both.inputs[0]); L(m, dot.outputs[0], both.inputs[1])
    # knit colour variation
    nz = N(m, 'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 300; L(m, tc.outputs['UV'], nz.inputs[0])
    knit = N(m, 'ShaderNodeMix', data_type='RGBA'); L(m, nz.outputs[0], knit.inputs[0]); knit.inputs[6].default_value = (.004, .007, .035, 1); knit.inputs[7].default_value = (.015, .022, .09, 1)
    col = N(m, 'ShaderNodeMix', data_type='RGBA'); L(m, both.outputs[0], col.inputs[0]); L(m, knit.outputs[2], col.inputs[6]); col.inputs[7].default_value = (.02, .06, .38, 1)
    L(m, col.outputs[2], P(m).inputs['Base Color'])
    rgh = N(m, 'ShaderNodeMapRange'); L(m, both.outputs[0], rgh.inputs[0]); rgh.inputs[3].default_value = .85; rgh.inputs[4].default_value = .35
    L(m, rgh.outputs[0], P(m).inputs['Roughness'])
    bp = N(m, 'ShaderNodeBump'); bp.inputs['Strength'].default_value = .8; bp.inputs['Distance'].default_value = .001; L(m, both.outputs[0], bp.inputs['Height']); L(m, nm.outputs[0], bp.inputs['Normal'])
    L(m, bp.outputs[0], P(m).inputs['Normal'])
    for o in gl:
        o.data.materials.clear(); o.data.materials.append(m)
        if o.parent is None: o.parent = root
    for o in bpy.context.selected_objects:
        if o.parent is None and o is not root: o.parent = root
    return dict(axis='Z', sway=60, tilt=50, center=None)

def make_goggles():
    # wraparound safety spectacles: one smoke lens, orange and black arms
    Rw = .075; Hh = .025; SP = .85
    bm = bmesh.new(); nu, nv = 160, 24
    def edge(a):
        A = abs(a)
        top = 1.0 - .12 * A ** 4
        bot = -1.0 + 1.5 * max(0, A - .5) ** 2 + .25 * max(0, .5 - A) ** 2
        if A < .24: bot = max(bot, -1 + 1.12 * (1 - (A / .24) ** 2) ** .5)
        return bot, top
    def P_(a, h):
        th = a * SP
        return (Rw * math.sin(th) * 1.08, Rw * .9 * (1 - math.cos(th)), h * Hh)
    cols = []
    for i in range(nu + 1):
        a = i / nu * 2 - 1; bot, top = edge(a)
        cols.append([bm.verts.new(P_(a, bot + (top - bot) * j / nv)) for j in range(nv + 1)])
    for i in range(nu):
        for j in range(nv):
            bm.faces.new((cols[i][j], cols[i + 1][j], cols[i + 1][j + 1], cols[i][j + 1]))
    me = bpy.data.meshes.new('lens'); bm.to_mesh(me); bm.free()
    for f in me.polygons: f.use_smooth = True
    lens = obj('lens', me); solid(lens, .0022)
    lm = mat('smoke', (.1, .105, .115), .03, **{'Transmission Weight': .72, 'IOR': 1.58, 'Coat Weight': .6, 'Coat Roughness': .02})
    assign(lens, lm)
    blk = mat('blk', (.012, .012, .014), .35)
    org = mat('orange', (1, .48, .03), .3)
    # brow bar along the top edge
    brow = [P_(t, edge(t)[1] + .04) for t in [k / 20 * 2 - 1 for k in range(21)]]
    tube('brow', brow, .0022, mat_=blk)
    def box(name, ln, th, ht, m_):
        bpy.ops.mesh.primitive_cube_add(size=1); o = bpy.context.object; o.name = name
        o.scale = (th, ln, ht); bpy.ops.object.transform_apply(scale=True)
        for v in o.data.vertices: v.co.y += ln / 2      # starts at its origin, runs along +Y
        bevel(o, .0012, 2); assign(o, m_)
        return o
    for s_ in (-1, 1):
        x0, y0, z0 = P_(s_ * .985, .55)
        arm = box('arm', .118, .0042, .011, org); arm.location = (x0, y0 - .003, z0); arm.rotation_euler = (0, 0, -s_ * .07)
        tip = box('tip', .045, .0046, .009, blk)
        ang = -s_ * .07
        tip.location = (x0 - math.sin(ang) * .114, y0 - .003 + math.cos(ang) * .114, z0)
        tip.rotation_euler = (-.55, 0, ang)
        hinge = box('hinge', .012, .006, .013, blk); hinge.location = (x0, y0 - .006, z0); hinge.rotation_euler = (0, 0, ang)
    for o in bpy.data.objects:
        if o.type in ('MESH', 'CURVE') and o.parent is None: o.parent = root
    return dict(axis='Z', sway=55, tilt=16, center=None, base_rot=-28)

def make_goggles2():
    # the earlier design the owner liked: one clear wrap-round lens, a BAM-blue brow, frame and arms, dark tips
    S = .064   # outline units -> metres
    def bez(p0, p1, p2, p3, n=24):
        return [tuple((1-t)**3*p0[i] + 3*(1-t)**2*t*p1[i] + 3*(1-t)*t*t*p2[i] + t**3*p3[i] for i in range(2)) for t in [k / n for k in range(1, n + 1)]]
    def quad(p0, p1, p2, n=12):
        return [tuple((1-t)**2*p0[i] + 2*(1-t)*t*p1[i] + t*t*p2[i] for i in range(2)) for t in [k / n for k in range(1, n + 1)]]
    O = [(-1.18, .22)]
    O += bez(O[-1], (-.9, .36), (-.3, .34), (0, .3)); O += bez(O[-1], (.3, .34), (.9, .36), (1.18, .22))
    O += bez(O[-1], (1.22, -.05), (1.08, -.42), (.62, -.44)); O += bez(O[-1], (.3, -.45), (.2, -.3), (.12, -.12))
    O += quad(O[-1], (0, .02), (-.12, -.12)); O += bez(O[-1], (-.2, -.3), (-.3, -.45), (-.62, -.44))
    O += bez(O[-1], (-1.08, -.42), (-1.22, -.05), (-1.18, .22))[:-1]
    K = .32
    W = lambda x, y, z=0.: (x * S, (K * x * x - z) * S, y * S)     # blender: x across, y depth (back), z up
    # lens: an n-gon from the outline, cut into small triangles, then bent round the face
    bm = bmesh.new()
    vs = [bm.verts.new((x, y, 0)) for x, y in O]
    f = bm.faces.new(vs)
    bmesh.ops.triangulate(bm, faces=[f])
    for _ in range(3): bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, use_grid_fill=True)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    for v in bm.verts: v.co = Vector(W(v.co.x, v.co.y))
    me = bpy.data.meshes.new('lens'); bm.to_mesh(me); bm.free()
    for p_ in me.polygons: p_.use_smooth = True
    lens = obj('lens', me); solid(lens, .0025)
    lm = mat('clear', (.55, .7, 1.0), .03, **{'Transmission Weight': .78, 'IOR': 1.5, 'Coat Weight': .6, 'Coat Roughness': .02, 'Coat Tint': (.75, .85, 1, 1)})
    assign(lens, lm)
    blue = mat('blue', (.012, .085, .78), .25, **{'Coat Weight': 1.0, 'Coat Roughness': .06})
    dark = mat('dark', (.01, .015, .04), .3, **{'Coat Weight': .6})
    # rim round the lens and a brow along the top
    rim = [W(x, y, .01) for x, y in O[::2]] + [W(*O[0], .01)]
    cu = tube('rim', rim, .036 * S, mat_=blue); cu.data.splines[0].use_cyclic_u = True
    bp = [W(-1.16 + i * 2.32 / 32, .24 + .1 * math.cos((-1.16 + i * 2.32 / 32) * 1.35) - .02, .03) for i in range(33)]
    br = tube('brow', bp, .036 * S, mat_=blue)
    for x in (-1, 1):
        n_ = lathe('pad', [(0, -.07), (.05, -.05), (.07, 0), (.05, .05), (0, .07)], seg=24)
        n_.scale = (.6 * S, .8 * S, 1.4 * S); n_.location = W(x * .15, -.16, -.06)
        assign(n_, dark)
        z0 = -.32 * 1.18 * 1.18
        arm = [W(x * 1.17, .18, z0), W(x * 1.2, .17, z0 - .5), W(x * 1.2, .13, z0 - 1.2), W(x * 1.18, 0, z0 - 1.55), W(x * 1.15, -.2, z0 - 1.72)]
        # z here is depth in outline units; W puts depth on y: rebuild with depth term
        arm = [(p[0], (-(z) ) * S, p[2]) for p, z in zip(arm, (z0, z0 - .5, z0 - 1.2, z0 - 1.55, z0 - 1.72))]
        tube('arm', arm, .05 * S, mat_=blue)
        tip = [(x * 1.18 * S, -(z0 - 1.5) * S, .02 * S), (x * 1.16 * S, -(z0 - 1.65) * S, -.12 * S), (x * 1.15 * S, -(z0 - 1.72) * S, -.2 * S)]
        tube('tip', tip, .058 * S, mat_=dark)
    for o in bpy.data.objects:
        if o.type in ('MESH', 'CURVE') and o.parent is None: o.parent = root
    return dict(axis='Z', sway=55, tilt=16, center=None, base_rot=-28)

cfg = {'cone': make_cone, 'light': make_light, 'tape': make_tape, 'shovel': make_shovel, 'hessian': make_hessian, 'gloves': make_gloves, 'goggles': make_goggles, 'goggles2': make_goggles2}[item]()

# ---------- framing ----------
bpy.context.view_layer.update()
def bbox_world():
    pts = []
    dg = bpy.context.evaluated_depsgraph_get()
    for o in bpy.data.objects:
        if o.type in ('MESH', 'CURVE'):
            oe = o.evaluated_get(dg); me_ = oe.to_mesh()
            pts += [oe.matrix_world @ v.co for v in me_.vertices]
            oe.to_mesh_clear()
    return pts
pts = bbox_world()
mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
ctr = Vector(cfg['center']) if cfg.get('center') else (mn + mx) / 2
for o in bpy.data.objects:
    if o.parent == root: o.location -= ctr
rad = max((p - ctr).length for p in pts)

cam_d = bpy.data.cameras.new('cam'); cam_d.lens = 85; cam_d.sensor_width = 36
cam = bpy.data.objects.new('cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
tilt = math.radians(cfg.get('tilt', 10))
dist = rad / math.sin(math.atan(18 / 85)) * 1.04
cam.location = (0, -dist * math.cos(tilt), dist * math.sin(tilt))
cam.rotation_euler = (math.pi / 2 - tilt, 0, 0)
sc.render.resolution_x = SIZE; sc.render.resolution_y = SIZE
root.rotation_euler.z = math.radians(cfg.get('base_rot', 0)); root.rotation_euler.x = math.radians(cfg.get('base_x', 0))

os.makedirs(outdir, exist_ok=True)
axis = {'X': 0, 'Y': 1, 'Z': 2}[cfg['axis']]
base = list(root.rotation_euler)
for f in range(FR):
    k = .5 if FR == 1 else f / (FR - 1)
    ang = math.radians(cfg['sway']) * (-.5 + (1 - math.cos(math.pi * k)) / 2)
    r = list(base); r[axis] = base[axis] + ang; root.rotation_euler = r
    sc.render.filepath = os.path.join(outdir, '%s_%02d.png' % (item, f))
    bpy.ops.render.render(write_still=True)
print('done', item, rad)
