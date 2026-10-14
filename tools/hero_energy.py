"""
Electric light for the water hero (public/brand/hero-energy.webp): glowing plasma filaments bursting
from behind the bottle — ice-cyan and electric blue to the left, violet and magenta up and right,
a little amber low down. Painted on black so the site can lay it over the water with
mix-blend-mode: screen (black disappears, the light adds on).
Usage: python3 tools/hero_energy.py
"""
import math
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, "tools")
from paint_scenes import rng  # noqa: E402

OUT = "storefront/public/brand/hero-energy.webp"
W, H = 1600, 1000
SC = 2  # draw at 2x
CX, CY = 0.79 * W, 0.50 * H  # behind the bottle
r = rng(37)

PALETTE = {
    "ice": (110, 235, 255),
    "cyan": (40, 220, 255),
    "blue": (50, 110, 255),
    "violet": (140, 50, 255),
    "magenta": (230, 40, 230),
    "amber": (255, 150, 40),
}


def colour_for(theta):
    """theta: direction from the burst, 0 = right, pi/2 = down (screen space)."""
    d = math.degrees(theta) % 360
    if 120 <= d < 210:
        return r.choice(["cyan", "cyan", "ice", "blue"])
    if 210 <= d < 260:
        return r.choice(["blue", "cyan", "violet"])
    if 260 <= d < 330:
        return r.choice(["violet", "violet", "magenta", "blue"])
    if d >= 330 or d < 30:
        return r.choice(["magenta", "violet", "amber"])
    if 30 <= d < 80:
        return r.choice(["amber", "amber", "magenta"])
    return r.choice(["blue", "cyan", "amber"])


def field(x, y, seed):
    """A smooth swirling direction field, so filaments curl like plasma."""
    a = math.sin(x * 0.0042 + seed) * 1.3 + math.cos(y * 0.0051 - seed * 0.7) * 1.1 + math.sin((x + y) * 0.0023 + seed * 1.9)
    return a


buckets = {k: Image.new("L", (W * SC, H * SC), 0) for k in PALETTE}
draws = {k: ImageDraw.Draw(v) for k, v in buckets.items()}

N = 210
for i in range(N):
    theta = r.uniform(0, math.tau)
    # fewer filaments heading into the text area on the left-top
    if 150 < math.degrees(theta) % 360 < 200 and r.random() < 0.35:
        continue
    col = colour_for(theta)
    start_r = r.uniform(70, 170)
    x = CX + math.cos(theta) * start_r
    y = CY + math.sin(theta) * start_r * 0.8
    length = r.uniform(220, 720) * (1.15 if col in ("cyan", "ice", "violet") else 1)
    step = 6.0
    seed = r.uniform(0, 100)
    curl = r.uniform(0.8, 1.8) * r.choice([-1, 1])
    heading = theta
    pts = [(x, y)]
    travelled = 0.0
    while travelled < length:
        swirl = field(x, y, seed)
        # mostly outward, bent by the field, with a little jitter for the electric look
        heading += (swirl * 0.045 * curl) + 0.012 * curl + r.normal(0, 0.09)
        outward = math.atan2(y - CY, x - CX)
        heading = heading * 0.9 + outward * 0.1 if abs(((heading - outward + math.pi) % math.tau) - math.pi) > 1.4 else heading
        x += math.cos(heading) * step
        y += math.sin(heading) * step
        travelled += step
        pts.append((x, y))
        if not (-50 < x < W + 50 and -50 < y < H + 50):
            break
    if len(pts) < 4:
        continue
    # fade along the length: bright near the burst, thin and dim at the tips
    n = len(pts)
    base = r.uniform(150, 255)
    width = r.choice([1, 2, 2, 2, 3, 3])
    for k in range(n - 1):
        t = k / (n - 1)
        v = int(base * (1 - t) ** 1.3)
        if v < 6:
            break
        (x0, y0), (x1, y1) = pts[k], pts[k + 1]
        draws[col].line([(x0 * SC, y0 * SC), (x1 * SC, y1 * SC)], fill=v, width=max(1, int(width * SC * (1 - 0.6 * t))))

acc = np.zeros((H, W, 3), np.float32)
for name, img in buckets.items():
    small = img.resize((W, H), Image.LANCZOS)
    core = np.asarray(small, np.float32) / 255
    g1 = np.asarray(small.filter(ImageFilter.GaussianBlur(3)), np.float32) / 255
    g2 = np.asarray(small.filter(ImageFilter.GaussianBlur(12)), np.float32) / 255
    g3 = np.asarray(small.filter(ImageFilter.GaussianBlur(40)), np.float32) / 255
    light = core * 1.3 + g1 * 1.7 + g2 * 1.4 + g3 * 1.1
    c = np.array(PALETTE[name], np.float32)
    # the core of each filament runs hotter (towards white)
    acc += light[..., None] * c + (core * 0.6)[..., None] * (255 - c) * 0.12

# the burst itself, behind the bottle, and a few sparks where filaments cross
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
for sx, sy, rad, col, k in [
    (CX - 140, CY + 10, 240, (20, 110, 255), 0.45),
    (CX + 150, CY - 120, 220, (130, 30, 255), 0.45),
    (CX + 120, CY + 200, 150, (255, 110, 30), 0.3),
]:
    g = np.exp(-(((xx - sx) ** 2 + (yy - sy) ** 2) / (2 * rad**2)))
    acc += g[..., None] * np.array(col, np.float32) * k
for _ in range(14):
    ang = r.uniform(0, math.tau)
    dist = r.uniform(120, 520)
    sx, sy = CX + math.cos(ang) * dist, CY + math.sin(ang) * dist * 0.75
    col = np.array(PALETTE[colour_for(ang)], np.float32)
    g = np.exp(-(((xx - sx) ** 2 + (yy - sy) ** 2) / (2 * r.uniform(4, 9) ** 2)))
    halo = np.exp(-(((xx - sx) ** 2 + (yy - sy) ** 2) / (2 * 40**2))) * 0.35
    acc += (g * 1.6 + halo)[..., None] * (col * 0.6 + 255 * 0.4)

# soft tone-map so bright overlaps glow instead of clipping flat
out = 255 * (1 - np.exp(-acc / 255 * 0.95))
# keep the far left (text) quiet
fade = np.clip((xx / W - 0.12) / 0.38, 0, 1) ** 1.5
# and every edge fades to black, so the layer can turn without showing a rectangle
def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)
edge = smooth(xx / 160) * smooth((W - 1 - xx) / 160) * smooth(yy / 140) * smooth((H - 1 - yy) / 140)
out *= (fade * edge)[..., None]
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGB").save(OUT, "WEBP", quality=82, method=6)
print("hero energy written", OUT)
