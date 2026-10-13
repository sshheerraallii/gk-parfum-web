"""
Paints a note-themed backdrop for every scent (woods, citrus, smoke, water, petals...) as a moody,
shallow-depth-of-field "product photo" set, with a stone ledge the bottle stands on.
  public/bottles/<slug>-bg.webp     backdrop only (the site layers the bottle + cap on top, so the cap can lift)
  public/bottles/<slug>-scene.jpg   backdrop with the bottle in place (SEO, sharing, Google Shopping)
Usage: python3 tools/paint_scenes.py storefront/public/bottles
"""
import math
import zlib
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 800, 1000
LEDGE = 0.80  # where the bottle stands, as a fraction of the height
BOTTLE_H = 0.62  # bottle height as a fraction of the canvas
out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("storefront/public/bottles")


def rng(seed):
    return np.random.default_rng(seed)


def fbm(r, h, w, octaves=5, base=6):
    """Fractal noise in 0..1."""
    acc = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        n = base * 2**o
        small = r.random((n + 1, int(n * w / h) + 2)).astype(np.float32)
        layer = np.asarray(Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), np.float32) / 255
        acc += layer * amp
        tot += amp
        amp *= 0.5
    acc /= tot
    return (acc - acc.min()) / (acc.max() - acc.min() + 1e-6)


def grad(c1, c2, h=H, w=W):
    t = np.linspace(0, 1, h)[:, None, None]
    return np.broadcast_to(np.array(c1) * (1 - t) + np.array(c2) * t, (h, w, 3)).astype(np.float32)


def glow(img, x, y, rad, color, strength=1.0):
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx - x) / rad) ** 2 + ((yy - y) / rad) ** 2)
    g = np.exp(-(d**2) * 1.6)[..., None] * strength
    return img + g * np.array(color, np.float32)


def vignette(img, k=0.55):
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H * 0.48) / (H * 0.62)) ** 2)
    return img * np.clip(1 - k * d**2, 0.2, 1)[..., None]


def grain(img, r, amt=6):
    return img + (r.random((H, W, 1)).astype(np.float32) - 0.5) * amt


def to_img(a):
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def layer_draw(fn, blur, opacity=1.0):
    """Draw RGBA shapes on a transparent layer and blur it (depth of field)."""
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fn(ImageDraw.Draw(lay), lay)
    if blur:
        lay = lay.filter(ImageFilter.GaussianBlur(blur))
    if opacity < 1:
        a = lay.getchannel("A").point(lambda v: int(v * opacity))
        lay.putalpha(a)
    return lay


def comp(base, lay):
    b = to_img(base).convert("RGBA")
    b.alpha_composite(lay)
    return np.asarray(b.convert("RGB"), np.float32)


# ── motifs ────────────────────────────────────────────────────────────────

def smoke(img, r, color, amount=0.8, rise=True):
    n = fbm(r, H, W, 6, 3)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    warp = fbm(r, H, W, 4, 2)
    s = np.sin((xx / W * 6 + warp * 7 + yy / H * 2.5) * 1.3) * 0.5 + 0.5
    m = (s * n) ** 2.2
    if rise:
        m *= np.clip(1.2 - yy / H, 0, 1) ** 0.8
    m = np.asarray(to_img(m[..., None].repeat(3, 2) * 255).filter(ImageFilter.GaussianBlur(6)), np.float32)[..., :1] / 255
    return img + m * np.array(color) * amount


def wood(img, r, c_dark, c_light, amount=1.0, scale=1.0):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    n = fbm(r, H, W, 5, 4)
    rings = np.sin((xx / W * 22 * scale + n * 9 + np.sin(yy / H * 3) * 1.4)) * 0.5 + 0.5
    fine = fbm(r, H, W, 3, 40)
    t = np.clip(rings * 0.75 + fine * 0.25, 0, 1)[..., None]
    w = np.array(c_dark) * (1 - t) + np.array(c_light) * t
    return img * (1 - amount) + w * amount


def caustics(img, r, color, amount=1.0):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32) / W
    warp = fbm(r, H, W, 3, 3) * 2
    acc = np.zeros((H, W), np.float32)
    for k in range(5):
        a = r.random() * math.pi
        f = 9 + r.random() * 8
        acc += np.sin((xx * math.cos(a) + yy * math.sin(a)) * f + warp * 3 + k)
    c = (1 - np.abs(np.tanh(acc * 0.9))) ** 6
    c = np.asarray(to_img(c[..., None].repeat(3, 2) * 255).filter(ImageFilter.GaussianBlur(1.5)), np.float32)[..., :1] / 255
    return img + c * np.array(color) * amount


def bokeh(r, colors, count, rmin, rmax, blur, alpha=(60, 160), area=(0, 0, W, H)):
    def fn(d, _):
        for _ in range(count):
            x = r.uniform(area[0], area[2])
            y = r.uniform(area[1], area[3])
            rad = r.uniform(rmin, rmax)
            c = colors[r.integers(len(colors))]
            d.ellipse([x - rad, y - rad, x + rad, y + rad], fill=(*c, int(r.uniform(*alpha))))
    return layer_draw(fn, blur)


def leaves(r, colors, count, size, blur, area=(0, 0, W, H), mint=False):
    def fn(_, lay):
        for _ in range(count):
            L = r.uniform(*size)
            leaf = Image.new("RGBA", (int(L * 2.2), int(L * 2.2)), (0, 0, 0, 0))
            d = ImageDraw.Draw(leaf)
            c = colors[r.integers(len(colors))]
            cx, cy = leaf.width / 2, leaf.height / 2
            wdt = L * (0.42 if mint else 0.3)
            pts = []
            for i in range(41):
                t = i / 40
                pts.append((cx - L / 2 + t * L, cy - math.sin(t * math.pi) ** (0.8 if mint else 1.1) * wdt))
            for i in range(40, -1, -1):
                t = i / 40
                pts.append((cx - L / 2 + t * L, cy + math.sin(t * math.pi) ** (0.8 if mint else 1.1) * wdt))
            d.polygon(pts, fill=(*c, 235))
            vein = tuple(min(255, v + 45) for v in c)
            d.line([(cx - L / 2, cy), (cx + L / 2, cy)], fill=(*vein, 200), width=max(1, int(L / 60)))
            for i in range(1, 7):
                x = cx - L / 2 + i * L / 7
                d.line([(x, cy), (x + L / 9, cy - wdt * 0.7)], fill=(*vein, 110), width=1)
                d.line([(x, cy), (x + L / 9, cy + wdt * 0.7)], fill=(*vein, 110), width=1)
            leaf = leaf.rotate(r.uniform(0, 360), resample=Image.BICUBIC)
            lay.alpha_composite(leaf, (int(r.uniform(area[0], area[2]) - leaf.width / 2), int(r.uniform(area[1], area[3]) - leaf.height / 2)))
    return layer_draw(fn, blur)


def citrus(r, flesh, rind, count, size, blur, area=(0, 0, W, H)):
    def fn(_, lay):
        for _ in range(count):
            R = r.uniform(*size)
            s = Image.new("RGBA", (int(R * 2.2), int(R * 2.2)), (0, 0, 0, 0))
            d = ImageDraw.Draw(s)
            c = s.width / 2
            d.ellipse([c - R, c - R, c + R, c + R], fill=(*rind, 255))
            d.ellipse([c - R * 0.9, c - R * 0.9, c + R * 0.9, c + R * 0.9], fill=(250, 240, 210, 255))
            segs = 10
            for k in range(segs):
                a0 = k / segs * 360 + 2
                a1 = (k + 1) / segs * 360 - 2
                fl = tuple(int(v * r.uniform(0.9, 1.05)) for v in flesh)
                d.pieslice([c - R * 0.84, c - R * 0.84, c + R * 0.84, c + R * 0.84], a0, a1, fill=(*[min(255, v) for v in fl], 245))
            d.ellipse([c - R * 0.1, c - R * 0.1, c + R * 0.1, c + R * 0.1], fill=(250, 240, 210, 255))
            s = s.rotate(r.uniform(0, 360), resample=Image.BICUBIC)
            sq = r.uniform(0.45, 1.0)  # seen at an angle
            s = s.resize((s.width, max(4, int(s.height * sq))))
            lay.alpha_composite(s, (int(r.uniform(area[0], area[2]) - s.width / 2), int(r.uniform(area[1], area[3]) - s.height / 2)))
    return layer_draw(fn, blur)


def petals(r, colors, count, size, blur, area=(0, 0, W, H)):
    def fn(_, lay):
        for _ in range(count):
            L = r.uniform(*size)
            p = Image.new("RGBA", (int(L * 1.6), int(L * 1.6)), (0, 0, 0, 0))
            d = ImageDraw.Draw(p)
            c = colors[r.integers(len(colors))]
            cx, cy = p.width / 2, p.height / 2
            pts = []
            for i in range(60):
                t = i / 60 * 2 * math.pi
                rr = L / 2 * (0.75 + 0.25 * math.cos(t)) * (1 - 0.18 * math.cos(2 * t))
                pts.append((cx + rr * math.cos(t) * 0.8, cy + rr * math.sin(t)))
            d.polygon(pts, fill=(*c, 230))
            hi = tuple(min(255, v + 35) for v in c)
            d.ellipse([cx - L * 0.15, cy - L * 0.3, cx + L * 0.12, cy + L * 0.05], fill=(*hi, 90))
            p = p.rotate(r.uniform(0, 360), resample=Image.BICUBIC)
            lay.alpha_composite(p, (int(r.uniform(area[0], area[2]) - p.width / 2), int(r.uniform(area[1], area[3]) - p.height / 2)))
    return layer_draw(fn, blur)


def berries(r, colors, count, size, blur, area=(0, 0, W, H)):
    def fn(d, _):
        for _ in range(count):
            R = r.uniform(*size)
            x, y = r.uniform(area[0], area[2]), r.uniform(area[1], area[3])
            c = colors[r.integers(len(colors))]
            for k in range(8, 0, -1):  # shaded sphere
                f = k / 8
                cc = tuple(int(v * (0.45 + 0.55 * (1 - f) + 0.25)) for v in c)
                d.ellipse([x - R * f, y - R * f, x + R * f, y + R * f], fill=(*[min(255, v) for v in cc], 255))
            d.ellipse([x - R * 0.45, y - R * 0.55, x - R * 0.1, y - R * 0.25], fill=(255, 235, 235, 170))
            d.line([(x, y - R), (x + R * 0.4, y - R * 2.2)], fill=(70, 90, 40, 220), width=max(2, int(R / 8)))
    return layer_draw(fn, blur)


def streaks(img, r, colors, count, amount=0.9):
    """Long, soft ribbons of light — the 'neon' energy of a studio set."""
    lay = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(lay)
    for _ in range(count):
        c = colors[r.integers(len(colors))]
        x0 = r.uniform(-100, W + 100)
        pts = []
        ph, amp, fr = r.uniform(0, 6), r.uniform(60, 180), r.uniform(1.5, 3.5)
        for i in range(60):
            t = i / 59
            pts.append((x0 + math.sin(t * fr + ph) * amp + (t - 0.5) * r.uniform(-300, 300), t * H * 0.9 - 40))
        d.line(pts, fill=c, width=int(r.uniform(2, 6)))
    soft = np.asarray(lay.filter(ImageFilter.GaussianBlur(10)), np.float32)
    sharp = np.asarray(lay.filter(ImageFilter.GaussianBlur(2)), np.float32)
    return img + (soft * 1.6 + sharp * 0.5) * amount


def ledge(img, r, top_color, front_color, kind="stone"):
    """A slab the bottle stands on, with a soft contact shadow."""
    y = int(H * LEDGE)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    top = (yy >= y - 70) & (yy < y + 8)
    front = yy >= y + 8
    n = fbm(r, H, W, 5, 10)
    if kind == "wood":
        tex = wood(np.zeros((H, W, 3), np.float32), r, np.array(top_color) * 0.7, np.array(top_color) * 1.15)
    else:
        tex = (np.array(top_color) * (0.82 + n[..., None] * 0.36))
    out = img.copy()
    # top surface fades into the backdrop (out of focus), front face darker
    fade = np.clip((yy - (y - 70)) / 70, 0, 1)[..., None]
    out = np.where(top[..., None], out * (1 - fade) + tex * fade, out)
    ft = np.array(front_color) * (0.85 + n[..., None] * 0.3) * np.clip(1.05 - (yy - y) / (H - y) * 0.5, 0.4, 1)[..., None]
    out = np.where(front[..., None], ft, out)
    edge = np.exp(-((yy - (y + 8)) / 2.2) ** 2)[..., None] * 60
    out = out + edge * np.array([1.0, 0.9, 0.75])
    # contact shadow
    bw = W * 0.27
    sh = np.exp(-(((xx - W / 2) / bw) ** 2 + ((yy - (y + 2)) / 13) ** 2) * 1.2)[..., None]
    out = out * (1 - sh * 0.75)
    return out


# ── scenes ────────────────────────────────────────────────────────────────

def scene(slug):
    r = rng(zlib.crc32(slug.encode()))
    G = {
        "eventus": lambda: citrus_scene(r, (250, 196, 70), (232, 150, 40), (40, 32, 18), (95, 70, 30), extra="smoke"),
        "imagine": lambda: citrus_scene(r, (250, 214, 90), (240, 175, 60), (16, 30, 48), (40, 70, 100), extra="tea"),
        "kings-code": lambda: woods_scene(r, (60, 34, 20), (150, 92, 50), accent=[(230, 90, 40), (240, 130, 60)], herb=True),
        "midnight-elixir": lambda: smoke_scene(r, (22, 16, 28), (70, 45, 80), (180, 140, 210), accent=[(140, 100, 190), (200, 120, 60)]),
        "angels-pour": lambda: cognac_scene(r),
        "althaire": lambda: vanilla_scene(r),
        "baccara-rouge": lambda: amber_red_scene(r),
        "nomad": lambda: woods_scene(r, (44, 24, 18), (125, 70, 44), accent=[(210, 50, 80), (240, 110, 120), (230, 140, 70)], smoky=True, berry=True),
        "noir-orchid": lambda: dark_floral_scene(r),
        "royal-oud": lambda: woods_scene(r, (46, 26, 14), (130, 76, 40), accent=[(220, 150, 70)], smoky=True),
        "lost-berry": lambda: cherry_scene(r),
        "symphonie": lambda: citrus_scene(r, (250, 120, 110), (245, 160, 90), (50, 22, 30), (120, 50, 70), extra="pink"),
        "amber-levant": lambda: smoke_scene(r, (36, 20, 8), (120, 70, 20), (255, 200, 120), accent=[(255, 170, 60), (240, 120, 40)]),
        "delina-rose": lambda: rose_scene(r, [(245, 160, 190), (230, 110, 150), (250, 200, 215)], (60, 24, 38), (150, 70, 100)),
        "empress-bloom": lambda: rose_scene(r, [(240, 120, 170), (200, 170, 230), (250, 210, 160)], (50, 20, 40), (140, 60, 110), fruit=True),
        "royal-musk": lambda: aquatic_scene(r),
    }
    return G[slug]()


def finish(img, r, top, front, kind="stone"):
    img = ledge(img, r, top, front, kind)
    img = vignette(img, 0.5)
    return grain(img, r, 7)


def citrus_scene(r, flesh, rind, c1, c2, extra=""):
    img = grad(c1, c2)
    img = glow(img, W * 0.5, H * 0.42, W * 0.55, np.array(rind) * 0.55)
    if extra == "smoke":
        img = smoke(img, r, (170, 150, 120), 0.5)
    img = comp(img, bokeh(r, [flesh, rind, (255, 240, 200)], 26, 10, 40, 14))
    img = comp(img, citrus(r, flesh, rind, 7, (60, 110), 9, area=(0, 0, W, H * 0.7)))
    img = comp(img, citrus(r, flesh, rind, 3, (110, 160), 22, area=(-40, H * 0.55, W + 40, H)))
    if extra == "tea":
        img = comp(img, leaves(r, [(70, 100, 55), (95, 120, 70)], 8, (50, 90), 5, area=(0, 0, W, H * 0.7)))
        img = comp(img, petals(r, [(255, 252, 240), (250, 244, 225)], 7, (26, 40), 3, area=(0, 0, W, H * 0.68)))
    return finish(img, r, (150, 130, 110), (70, 58, 48))


def woods_scene(r, dark, light, accent, herb=False, smoky=False, berry=False):
    img = wood(grad(dark, dark), r, np.array(dark) * 0.7, light, 1.0, 0.8)
    img = np.asarray(to_img(img).filter(ImageFilter.GaussianBlur(2.2)), np.float32) * 0.8
    img = glow(img, W * 0.5, H * 0.4, W * 0.5, np.array(accent[0]) * 0.45)
    if smoky:
        img = smoke(img, r, (200, 180, 160), 0.45)
    img = comp(img, bokeh(r, accent + [(255, 220, 160)], 18, 6, 26, 8, area=(0, 0, W, H * 0.72)))
    if berry:  # raspberry
        img = comp(img, berries(r, [(190, 30, 70), (160, 20, 60)], 9, (12, 20), 4, area=(0, 0, W, H * 0.66)))
    if herb:
        img = comp(img, leaves(r, [(70, 100, 60), (95, 120, 80), (60, 85, 70)], 9, (50, 100), 7, area=(0, 0, W, H * 0.7)))
        img = comp(img, berries(r, [(50, 60, 110), (40, 50, 90)], 10, (7, 12), 2, area=(W * 0.05, H * 0.15, W * 0.95, H * 0.65)))
    return finish(img, r, (120, 78, 46), (60, 36, 22), "wood")


def smoke_scene(r, c1, c2, smoke_col, accent):
    img = grad(c1, c2)
    img = glow(img, W * 0.5, H * 0.45, W * 0.5, np.array(accent[0]) * 0.5)
    img = smoke(img, r, smoke_col, 0.9)
    img = smoke(img, r, np.array(smoke_col) * 0.7, 0.5)
    img = comp(img, bokeh(r, accent, 22, 4, 18, 5, alpha=(80, 200), area=(0, 0, W, H * 0.75)))
    return finish(img, r, (90, 70, 60), (40, 30, 26))


def cognac_scene(r):
    img = grad((40, 18, 8), (110, 50, 16))
    img = glow(img, W * 0.5, H * 0.42, W * 0.55, (200, 110, 30))
    img = comp(img, bokeh(r, [(255, 170, 70), (240, 130, 40), (255, 210, 140)], 40, 12, 50, 18, alpha=(50, 140)))
    img = smoke(img, r, (230, 170, 110), 0.35)
    # cinnamon sticks
    def sticks(d, _):
        for _ in range(4):
            x, y = r.uniform(60, W - 60), r.uniform(H * 0.1, H * 0.65)
            a = r.uniform(-0.6, 0.6)
            L = r.uniform(150, 260)
            dx, dy = math.cos(a) * L / 2, math.sin(a) * L / 2
            d.line([(x - dx, y - dy), (x + dx, y + dy)], fill=(120, 60, 25, 255), width=22)
            d.line([(x - dx, y - dy - 6), (x + dx, y + dy - 6)], fill=(170, 95, 45, 255), width=6)
    img = comp(img, layer_draw(sticks, 6))
    return finish(img, r, (110, 70, 40), (55, 32, 18), "wood")


def vanilla_scene(r):
    img = grad((70, 45, 25), (170, 120, 70))
    img = glow(img, W * 0.5, H * 0.42, W * 0.55, (240, 200, 140))
    img = smoke(img, r, (255, 235, 200), 0.55)
    def pods(d, _):
        for _ in range(5):
            x, y = r.uniform(40, W - 40), r.uniform(H * 0.08, H * 0.68)
            a = r.uniform(-1.2, 1.2)
            L = r.uniform(180, 300)
            pts = [(x + math.cos(a) * (t - 0.5) * L + math.sin(t * 6) * 6, y + math.sin(a) * (t - 0.5) * L) for t in np.linspace(0, 1, 30)]
            d.line(pts, fill=(62, 36, 18, 255), width=26, joint="curve")
            d.line([(px, py - 6) for px, py in pts], fill=(110, 70, 38, 200), width=6, joint="curve")
    img = comp(img, layer_draw(pods, 9))
    img = comp(img, petals(r, [(255, 250, 240), (250, 240, 220)], 8, (28, 46), 4, area=(0, 0, W, H * 0.7)))
    return finish(img, r, (190, 160, 125), (110, 82, 58))


def amber_red_scene(r):
    img = grad((40, 4, 10), (120, 20, 26))
    img = glow(img, W * 0.5, H * 0.42, W * 0.55, (230, 70, 50))
    img = streaks(img, r, [(255, 120, 80), (255, 200, 120), (220, 40, 60)], 9, 0.55)
    def crystals(d, _):
        for _ in range(16):
            x, y = r.uniform(0, W), r.uniform(0, H * 0.7)
            s = r.uniform(10, 34)
            pts = [(x + math.cos(a) * s * r.uniform(0.6, 1), y + math.sin(a) * s * r.uniform(0.6, 1)) for a in np.linspace(0, 2 * math.pi, 7)[:-1]]
            d.polygon(pts, fill=(255, 150, 90, int(r.uniform(90, 200))))
    img = comp(img, layer_draw(crystals, 4))
    return finish(img, r, (110, 50, 50), (50, 14, 18))


def dark_floral_scene(r):
    img = grad((10, 6, 14), (45, 18, 50))
    img = glow(img, W * 0.5, H * 0.42, W * 0.5, (120, 50, 140))
    img = smoke(img, r, (150, 100, 170), 0.45)
    img = comp(img, petals(r, [(70, 20, 80), (110, 40, 120), (40, 10, 45)], 16, (60, 120), 8, area=(-40, -40, W + 40, H * 0.7)))
    img = comp(img, bokeh(r, [(210, 160, 230), (240, 200, 120)], 16, 3, 12, 3, alpha=(90, 200), area=(0, 0, W, H * 0.7)))
    return finish(img, r, (60, 46, 62), (24, 16, 26))


def cherry_scene(r):
    img = grad((30, 4, 12), (100, 14, 34))
    img = glow(img, W * 0.5, H * 0.42, W * 0.5, (210, 40, 70))
    img = comp(img, bokeh(r, [(255, 90, 110), (255, 160, 170)], 24, 10, 40, 16))
    img = comp(img, berries(r, [(170, 10, 40), (130, 6, 30), (190, 30, 50)], 12, (22, 38), 7, area=(0, 0, W, H * 0.66)))
    img = comp(img, berries(r, [(170, 10, 40), (140, 8, 34)], 4, (40, 60), 20, area=(0, H * 0.6, W, H)))
    return finish(img, r, (110, 60, 66), (48, 14, 22))


def rose_scene(r, colors, c1, c2, fruit=False):
    img = grad(c1, c2)
    img = glow(img, W * 0.5, H * 0.42, W * 0.55, np.array(colors[0]) * 0.6)
    img = comp(img, bokeh(r, colors + [(255, 240, 230)], 30, 10, 40, 14))
    img = comp(img, petals(r, colors, 18, (50, 110), 6, area=(-30, -30, W + 30, H * 0.72)))
    if fruit:
        img = comp(img, berries(r, [(240, 150, 90), (230, 200, 80)], 4, (30, 46), 9, area=(0, 0, W, H * 0.6)))
    img = comp(img, petals(r, colors, 4, (120, 180), 22, area=(-40, H * 0.62, W + 40, H)))
    return finish(img, r, (200, 160, 170), (110, 70, 85))


def aquatic_scene(r):
    img = grad((6, 40, 40), (20, 110, 100))
    img = glow(img, W * 0.5, H * 0.38, W * 0.55, (80, 220, 190))
    img = caustics(img, r, (170, 255, 230), 0.45)
    img = np.asarray(to_img(img).filter(ImageFilter.GaussianBlur(2.5)), np.float32)
    img = comp(img, leaves(r, [(40, 140, 70), (70, 170, 90), (30, 110, 60)], 12, (60, 120), 6, area=(-40, -40, W + 40, H * 0.7), mint=True))
    img = comp(img, bokeh(r, [(230, 255, 250), (160, 240, 220)], 26, 3, 14, 2, alpha=(80, 200), area=(0, 0, W, H * 0.72)))
    return finish(img, r, (150, 175, 170), (50, 80, 78))


def place_bottle(bg: Image.Image, slug: str) -> Image.Image:
    b = Image.open(out / f"{slug}.webp").convert("RGBA")
    h = int(H * BOTTLE_H)
    b = b.resize((int(b.width * h / b.height), h), Image.LANCZOS)
    x, y = (W - b.width) // 2, int(H * LEDGE) - h + 4
    canvas = bg.convert("RGBA")
    # a faint reflection on the ledge
    ref = b.transpose(Image.FLIP_TOP_BOTTOM).crop((0, 0, b.width, int(h * 0.18)))
    fade = Image.linear_gradient("L").resize(ref.size).point(lambda v: int((255 - v) * 0.22))
    ref.putalpha(Image.fromarray(np.minimum(np.asarray(ref.getchannel("A")), np.asarray(fade)).astype(np.uint8)))
    canvas.alpha_composite(ref, (x, y + h - 2))
    canvas.alpha_composite(b, (x, y))
    return canvas.convert("RGB")


if __name__ == "__main__":
    import json
    meta = json.loads((out / "bottles.json").read_text())
    slugs = sys.argv[2:] or list(meta)
    for slug in slugs:
        bg = to_img(scene(slug))
        bg.save(out / f"{slug}-bg.webp", "WEBP", quality=80, method=6)
        place_bottle(bg, slug).save(out / f"{slug}-scene.jpg", "JPEG", quality=84, optimize=True, progressive=True)
        print("painted", slug)
