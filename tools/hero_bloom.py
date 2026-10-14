"""
Colour for the water hero (public/brand/hero-bloom.webp): fruit, flowers and petals floating in the
water around the bottle — blood orange and lemon slices, rose petals, pink and coral blossoms,
raspberries — with warm sunlight pooling on the right. Transparent PNG-style layer that sits over
hero-water.webp and under the moving light, so the caustics play across everything.
Things further down are softer and cooler (depth); the left third stays calm so the text reads.
Usage: python3 tools/hero_bloom.py
"""
import math
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, "tools")
from paint_scenes import rng  # noqa: E402

OUT = "storefront/public/brand/hero-bloom.webp"
W, H = 1600, 1000
SS = 2  # supersample each object
r = rng(23)


def radial(size, inner, outer, cx=0.5, cy=0.5, power=1.0):
    h, w = size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx - cx * w) / (w / 2)) ** 2 + ((yy - cy * h) / (h / 2)) ** 2)
    t = np.clip(d, 0, 1) ** power
    return np.array(inner, np.float32) * (1 - t[..., None]) + np.array(outer, np.float32) * t[..., None]


def citrus(R, flesh, flesh_dark, pith=(250, 240, 214), rind=(230, 120, 20), segs=None):
    """A thin citrus slice seen from above: rind, pith, juicy segments with a hint of translucency."""
    S = int(R * 2 + 8)
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = S / 2
    d.ellipse([c - R, c - R, c + R, c + R], fill=rind + (255,))
    d.ellipse([c - R * 0.95, c - R * 0.95, c + R * 0.95, c + R * 0.95], fill=pith + (255,))
    # segments
    n = segs or int(r.integers(9, 12))
    a0 = r.uniform(0, math.tau)
    fl = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    rad = np.sqrt((xx - c) ** 2 + (yy - c) ** 2) / (R * 0.9)
    col = radial((S, S), flesh, flesh_dark, power=1.4)
    # juicy texture: fine radial streaks
    ang = np.arctan2(yy - c, xx - c)
    streak = 0.9 + 0.1 * np.sin(ang * 140 + rad * 9) * np.clip(rad, 0, 1)
    # juice sacs: blotchy light and dark flecks
    noise = np.asarray(Image.fromarray((r.random((S, S)) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(max(1, R * 0.03))), np.float32) / 255
    noise = (noise - noise.mean()) / (noise.std() + 1e-6)
    col *= (streak * (1 + 0.09 * noise))[..., None]
    col = col * 0.85 + np.array([255, 245, 225], np.float32) * 0.15 * np.exp(-((rad - 0.35) ** 2) / 0.05)[..., None]
    alpha = np.zeros((S, S), np.float32)
    for k in range(n):
        a = a0 + k * math.tau / n
        da = math.tau / n
        # wedge with rounded outer edge, membranes between segments
        rel = np.angle(np.exp(1j * (ang - a - da / 2)))
        inside = (np.abs(rel) * np.maximum(rad, 0.05) < (da / 2) * np.maximum(rad, 0.05) - 0.012 - 0.004 / np.maximum(rad, 0.05)) & (rad < 0.985) & (rad > 0.05)
        alpha = np.maximum(alpha, inside.astype(np.float32))
    fl_arr = np.dstack([np.clip(col, 0, 255), alpha * 245]).astype(np.uint8)
    fl = Image.fromarray(fl_arr, "RGBA").filter(ImageFilter.GaussianBlur(R * 0.006 + 0.4))
    img.alpha_composite(fl)
    # centre
    d = ImageDraw.Draw(img)
    d.ellipse([c - R * 0.07, c - R * 0.07, c + R * 0.07, c + R * 0.07], fill=pith + (255,))
    # wet highlight
    hl = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(hl).ellipse([c - R * 0.7, c - R * 0.78, c - R * 0.05, c - R * 0.35], fill=(255, 255, 255, 70))
    img.alpha_composite(hl.filter(ImageFilter.GaussianBlur(R * 0.12)))
    return img


def petal(L, base, tip, curl=0.0):
    """A rose petal: soft heart-ish shape, darker at the base, a pale edge and a gentle fold."""
    Wp, Hp = int(L * 0.95) + 8, int(L) + 8
    yy, xx = np.mgrid[0:Hp, 0:Wp].astype(np.float32)
    u = (xx - Wp / 2) / (L * 0.47)
    v = (yy - 4) / L  # 0 at the wide top, 1 at the base
    width = np.sin(np.clip(v, 0, 1) * math.pi * 0.92 + 0.25) * (1 - 0.35 * v)
    notch = 0.08 * np.exp(-((u) ** 2) / 0.01) * (v < 0.12)
    inside = (np.abs(u) < width) & (v > notch) & (v < 1)
    t = np.clip(v, 0, 1)[..., None]
    col = np.array(tip, np.float32) * (1 - t) + np.array(base, np.float32) * t
    edge = np.clip(1 - (width - np.abs(u)) / 0.12, 0, 1)[..., None]
    col = col * (1 - edge * 0.25) + np.array([255, 235, 240], np.float32) * edge * 0.25
    fold = np.exp(-((u - curl) ** 2) / 0.02)[..., None] * 0.18
    col = col * (1 - fold)
    veins = 1 - 0.06 * (np.sin(u * 40 + v * 6) > 0.85)[..., None]
    col *= veins
    a = inside.astype(np.float32) * 235
    img = Image.fromarray(np.dstack([np.clip(col, 0, 255), a]).astype(np.uint8), "RGBA")
    return img.filter(ImageFilter.GaussianBlur(0.8))


def blossom(R, outer, inner, centre=(255, 214, 90), petals=5):
    """Hibiscus-like flower: broad overlapping petals, darker throat, golden stamen."""
    S = int(R * 2.3) + 8
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    c = S / 2
    a0 = r.uniform(0, math.tau)
    S = int(R * 2.6) + 8
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    c = S / 2
    L = R * 1.1
    for k in range(petals):
        th = a0 + k * math.tau / petals
        p = petal(L, inner, outer, curl=r.uniform(-0.2, 0.2))
        p = p.rotate(math.degrees(th), resample=Image.BICUBIC, expand=True)
        # the petal's wide end points outward, its base at the flower's centre
        px, py = c - math.sin(th) * L * 0.44, c - math.cos(th) * L * 0.44
        img.alpha_composite(p, (int(px - p.width / 2), int(py - p.height / 2)))
    d = ImageDraw.Draw(img)
    throat = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(throat).ellipse([c - R * 0.35, c - R * 0.35, c + R * 0.35, c + R * 0.35], fill=tuple(int(x * 0.55) for x in inner) + (200,))
    img.alpha_composite(throat.filter(ImageFilter.GaussianBlur(R * 0.12)))
    for k in range(7):
        ang = r.uniform(0, math.tau)
        rr = r.uniform(0.05, 0.18) * R
        x, y = c + math.cos(ang) * rr, c + math.sin(ang) * rr
        d.ellipse([x - R * 0.04, y - R * 0.04, x + R * 0.04, y + R * 0.04], fill=centre + (255,))
    return img


def raspberry(R):
    S = int(R * 2.6) + 8
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    c = S / 2
    for k in range(95):
        ang = r.uniform(0, math.tau)
        rr = math.sqrt(r.uniform(0, 1)) * R * 0.95
        x, y = c + math.cos(ang) * rr, c + math.sin(ang) * rr * 1.08
        dr = R * r.uniform(0.2, 0.26)
        shade = 0.75 + 0.25 * (1 - rr / R)
        drup = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        dd = ImageDraw.Draw(drup)
        dd.ellipse([x - dr, y - dr, x + dr, y + dr], fill=(int(205 * shade), int(28 * shade), int(70 * shade), 255))
        dd.ellipse([x - dr * 0.55, y - dr * 0.65, x - dr * 0.05, y - dr * 0.15], fill=(255, 190, 210, 70))
        img.alpha_composite(drup)
    return img.filter(ImageFilter.GaussianBlur(0.6))


def place(canvas, obj, x, y, rot, depth, tint_to=(30, 110, 105)):
    """depth 0 = at the surface (sharp, full colour) … 1 = deep (soft, cooler, fainter)."""
    o = obj.rotate(rot, resample=Image.BICUBIC, expand=True)
    o = o.resize((max(1, o.width // SS), max(1, o.height // SS)), Image.LANCZOS)
    arr = np.asarray(o, np.float32)
    k = 0.55 * depth
    arr[..., :3] = arr[..., :3] * (1 - k) + np.array(tint_to, np.float32) * k
    arr[..., 3] *= 1 - 0.45 * depth
    o = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")
    pad = 40
    big = Image.new("RGBA", (o.width + pad * 2, o.height + pad * 2), (0, 0, 0, 0))
    big.alpha_composite(o, (pad, pad))
    o = big
    if depth > 0.05:
        o = o.filter(ImageFilter.GaussianBlur(depth * 9))
    # soft shadow on the water below things at the surface
    if depth < 0.3:
        sh = Image.new("RGBA", o.size, (0, 0, 0, 0))
        sh.putalpha(o.getchannel("A").point(lambda a: int(a * 0.35)))
        sh = sh.filter(ImageFilter.GaussianBlur(10))
        canvas.alpha_composite(sh, (int(x - o.width / 2 + 10), int(y - o.height / 2 + 16)))
    canvas.alpha_composite(o, (int(x - o.width / 2), int(y - o.height / 2)))


canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))

# warm light pooling on the right (behind the bottle) and a rose glow lower down
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
glow = np.zeros((H, W, 4), np.float32)
for gx, gy, sx, sy, col, a in [
    (0.86, 0.32, 0.20, 0.36, (255, 190, 110), 105),
    (0.95, 0.82, 0.22, 0.28, (235, 60, 120), 110),
    (0.70, 1.00, 0.22, 0.14, (255, 110, 90), 70),
    (1.00, 0.05, 0.14, 0.18, (255, 222, 140), 90),
]:
    g = np.exp(-(((xx - gx * W) / (W * sx)) ** 2 + ((yy - gy * H) / (H * sy)) ** 2))
    glow[..., :3] += g[..., None] * np.array(col, np.float32) * (a / 255)
    glow[..., 3] = np.maximum(glow[..., 3], g * a)
rgb = np.where(glow[..., 3:4] > 0, glow[..., :3] / np.maximum(glow[..., 3:4] / 255, 1e-3), 0)
canvas.alpha_composite(Image.fromarray(np.dstack([np.clip(rgb, 0, 255), glow[..., 3]]).astype(np.uint8), "RGBA"))

BLOOD = dict(flesh=(214, 40, 40), flesh_dark=(150, 18, 30), rind=(232, 92, 24))
ORANGE = dict(flesh=(255, 150, 30), flesh_dark=(236, 104, 10), rind=(240, 120, 16))
LEMON = dict(flesh=(255, 226, 70), flesh_dark=(240, 196, 30), rind=(246, 210, 40), pith=(252, 248, 224))
LIME = dict(flesh=(160, 210, 70), flesh_dark=(100, 170, 40), rind=(70, 140, 40), pith=(236, 246, 214))

# (kind, x, y, size, rotation, depth) — the left third (text) only gets faint, deep things
items = [
    # deep, soft layer
    ("orange", 1010, 140, 120, 10, 0.85), ("blossom-pink", 1500, 520, 110, 0, 0.8), ("lemon", 640, 900, 90, 0, 0.9),
    ("petal-red", 880, 300, 70, 40, 0.9), ("rasp", 1280, 70, 40, 0, 0.8), ("petal-pink", 300, 120, 60, 120, 0.95),
    ("blossom-coral", 70, 900, 100, 0, 0.92), ("lime", 820, 640, 80, 0, 0.88),
    # mid layer
    ("blood", 1490, 150, 150, 25, 0.45), ("blossom-pink", 1190, 930, 130, 15, 0.4), ("lemon", 960, 820, 110, 60, 0.5),
    ("petal-red", 1330, 330, 80, -30, 0.35), ("petal-pink", 1060, 560, 70, 70, 0.5), ("rasp", 1560, 820, 46, 0, 0.4),
    ("orange", 1560, 420, 120, -10, 0.55), ("petal-red", 760, 120, 56, 160, 0.6),
    # at the surface, crisp (around the bottle and the lower edge)
    ("blood", 1270, 860, 170, -15, 0.0), ("blossom-coral", 1520, 700, 120, 30, 0.05), ("petal-red", 1110, 720, 90, 20, 0.0),
    ("petal-pink", 1400, 250, 84, -60, 0.05), ("petal-red", 1015, 420, 60, 110, 0.1), ("rasp", 1380, 960, 54, 0, 0.0),
    ("rasp", 1440, 930, 48, 0, 0.0), ("orange", 860, 990, 130, 30, 0.15), ("petal-pink", 1570, 980, 70, 200, 0.05),
    ("blossom-pink", 1000, 60, 110, 45, 0.15), ("lemon", 1590, 60, 100, 12, 0.1),
]

for kind, x, y, s, rot, depth in sorted(items, key=lambda t: -t[5]):
    S = s * SS
    if kind == "blood":
        o = citrus(S, **BLOOD)
    elif kind == "orange":
        o = citrus(S, **ORANGE)
    elif kind == "lemon":
        o = citrus(S, **LEMON)
    elif kind == "lime":
        o = citrus(S, **LIME)
    elif kind == "petal-red":
        o = petal(S, (150, 10, 40), (225, 40, 70), curl=r.uniform(-0.3, 0.3))
    elif kind == "petal-pink":
        o = petal(S, (220, 80, 130), (255, 170, 200), curl=r.uniform(-0.3, 0.3))
    elif kind == "blossom-pink":
        o = blossom(S, (255, 140, 190), (220, 40, 120))
    elif kind == "blossom-coral":
        o = blossom(S, (255, 150, 110), (235, 70, 70))
    else:
        o = raspberry(S)
    place(canvas, o, x, y, rot, depth)

canvas.save(OUT, "WEBP", quality=84, method=6)
print("hero bloom written", OUT)
