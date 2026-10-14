"""
Textures for the water hero (public/brand):
  hero-water.webp     deep sapphire water with soft light shafts
  hero-caustics.webp  tileable dancing-light pattern (transparent) — slides slowly over the water
  hero-drops.webp     condensation droplets on glass (transparent) — sits in front of everything
Usage: python3 tools/hero_water.py
"""
import math
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, "tools")
from paint_scenes import fbm, rng  # noqa: E402

OUT = "storefront/public/brand/"
r = rng(11)

# ── 1. the water ─────────────────────────────────────────────────────────────
W, H = 1600, 1000
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
top = np.array([18, 52, 120], np.float32)
bottom = np.array([3, 8, 26], np.float32)
t = (yy / H)[..., None] ** 0.8
img = top * (1 - t) + bottom * t
# soft depth variation
n = fbm(r, H, W, 5, 3)[..., None]
img *= 0.8 + n * 0.45
# light shafts from the surface, slanting
for k in range(7):
    x0 = r.uniform(0.05, 0.95) * W
    wdt = r.uniform(30, 110)
    slope = 0.35
    d = np.abs((xx - x0) - (yy * slope))
    shaft = np.exp(-(d / wdt) ** 2) * np.clip(1 - yy / (H * 0.95), 0, 1) ** 1.5
    img += shaft[..., None] * np.array([60, 110, 170]) * r.uniform(0.25, 0.55)
# a warm glow where the bottle stands (ties it to the gold brand)
gx, gy = W * 0.72, H * 0.55
g = np.exp(-(((xx - gx) / (W * 0.28)) ** 2 + ((yy - gy) / (H * 0.4)) ** 2))[..., None]
img += g * np.array([40, 30, 70])
# vignette
v = np.sqrt(((xx - W / 2) / (W * 0.65)) ** 2 + ((yy - H * 0.45) / (H * 0.7)) ** 2)
img *= np.clip(1.05 - 0.55 * v**2, 0.25, 1)[..., None]
img += (r.random((H, W, 1)) - 0.5) * 5
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1)).save(OUT + "hero-water.webp", "WEBP", quality=80, method=6)

# ── 2. caustics, tileable ────────────────────────────────────────────────────
S = 800
y2, x2 = np.mgrid[0:S, 0:S].astype(np.float32) / S * 2 * math.pi
acc = np.zeros((S, S), np.float32)
# integer frequencies -> the pattern wraps seamlessly
# domain-warped so the cells are uneven, like real light under moving water (all integer -> still tileable)
wx = 0.8 * np.sin(3 * y2 + 1.3) + 0.5 * np.sin(5 * x2 - 2 * y2)
wy = 0.8 * np.sin(4 * x2 + 0.4) + 0.5 * np.sin(-3 * x2 + 6 * y2 + 2.1)
for fx, fy, ph in [(4, 3, 0.3), (-3, 5, 1.7), (7, -2, 2.9), (2, 7, 4.1), (-6, -4, 0.9), (8, 3, 5.2), (5, -7, 3.3)]:
    acc += np.sin(fx * (x2 + wx * 0.35) + fy * (y2 + wy * 0.35) + ph)
lines = (1 - np.abs(np.tanh(acc * 0.6))) ** 12
lines = np.asarray(Image.fromarray((np.clip(lines, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1)), np.float32) / 255
rgba = np.zeros((S, S, 4), np.uint8)
rgba[..., 0], rgba[..., 1], rgba[..., 2] = 190, 225, 255
rgba[..., 3] = np.clip(lines * 1.4 * 255, 0, 255).astype(np.uint8)
Image.fromarray(rgba).save(OUT + "hero-caustics.webp", "WEBP", quality=80, method=6)

# ── 3. condensation on glass ─────────────────────────────────────────────────
SC = 2  # draw big, shrink for smooth edges
DW, DH = W * SC, H * SC
drops = Image.new("RGBA", (DW, DH), (0, 0, 0, 0))


def droplet(R, elong=1.0):
    """One water drop: clear body, dark lower rim, bright lens highlight."""
    w, h = int(R * 2 + 8), int(R * 2 * elong + 8)
    d = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    a = np.zeros((h, w), np.float32)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w / 2, h / 2
    rr = np.sqrt(((xx - cx) / R) ** 2 + ((yy - cy) / (R * elong)) ** 2)
    body = rr < 1
    # colour: slightly lighter, cooler water seen through the drop, darker toward the top-left rim
    col = np.zeros((h, w, 4), np.float32)
    shade = np.clip((yy - cy) / (R * elong), -1, 1)
    col[..., 0] = 170 + shade * 50
    col[..., 1] = 230 + shade * 20
    col[..., 2] = 225 + shade * 25
    edge = np.clip((rr - 0.72) / 0.28, 0, 1)
    col[..., 3] = np.where(body, 38 + edge**2 * 120, 0)
    # dark crescent at the bottom edge (shadow of the lens)
    crescent = body & (rr > 0.78) & (yy > cy + R * elong * 0.2)
    col[..., :3] = np.where(crescent[..., None], col[..., :3] * 0.35, col[..., :3])
    col[..., 3] = np.where(crescent, 150, col[..., 3])
    # bright caustic at the bottom inside
    glow = body & (np.sqrt(((xx - cx) / (R * 0.55)) ** 2 + ((yy - (cy + R * elong * 0.45)) / (R * elong * 0.25)) ** 2) < 1)
    col[..., 3] = np.where(glow, np.maximum(col[..., 3], 120), col[..., 3])
    col[..., :3] = np.where(glow[..., None], np.array([235, 255, 250]), col[..., :3])
    d = Image.fromarray(np.clip(col, 0, 255).astype(np.uint8))
    # specular highlight, top-left
    hl = Image.new("RGBA", d.size, (0, 0, 0, 0))
    ImageDraw.Draw(hl).ellipse([cx - R * 0.55, cy - R * elong * 0.62, cx - R * 0.12, cy - R * elong * 0.25], fill=(255, 255, 255, 230))
    hl = hl.filter(ImageFilter.GaussianBlur(max(1, R * 0.06)))
    d.alpha_composite(hl)
    return d


def place_cluster(cx0, cy0, spread, count, rmin, rmax):
    for _ in range(count):
        R = r.uniform(rmin, rmax) * SC
        x = r.normal(cx0, spread[0]) * SC
        y = r.normal(cy0, spread[1]) * SC
        if not (0 <= x < DW and 0 <= y < DH):
            continue
        dp = droplet(R, r.uniform(1.0, 1.25) if R > 10 * SC else 1.0)
        drops.alpha_composite(dp, (int(x - dp.width / 2), int(y - dp.height / 2)))


# keep the text area (left-centre) clearer; heavier on the edges and corners
place_cluster(W * 0.06, H * 0.5, (90, 300), 260, 2, 7)
place_cluster(W * 0.95, H * 0.45, (90, 320), 260, 2, 7)
place_cluster(W * 0.5, H * 0.03, (520, 50), 220, 2, 6)
place_cluster(W * 0.5, H * 0.97, (520, 60), 220, 2, 7)
place_cluster(W * 0.9, H * 0.15, (120, 110), 40, 7, 20)
place_cluster(W * 0.08, H * 0.85, (110, 100), 35, 7, 22)
place_cluster(W * 0.55, H * 0.92, (300, 50), 18, 8, 18)
place_cluster(W * 0.5, H * 0.5, (650, 420), 120, 1.5, 4)  # fine mist everywhere
drops = drops.resize((W, H), Image.LANCZOS)
drops.save(OUT + "hero-drops.webp", "WEBP", quality=82, method=6)
print("hero water textures written")
