"""Dark stone with faint gold veins — the textured base of the hero. Writes public/brand/hero-stone.webp"""
import sys
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, "tools")
from paint_scenes import fbm, rng  # noqa: E402

W, H = 1600, 1000
r = rng(7)
n = fbm(r, H, W, 7, 3)
d = fbm(r, H, W, 6, 8)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
# marble-like veins: thin bright lines where a warped sine crosses zero
warp = fbm(r, H, W, 5, 2) * 9
v = np.abs(np.sin(xx / W * 5 + yy / H * 3 + warp))
veins = np.clip(1 - v / 0.035, 0, 1) ** 2 * (0.4 + 0.6 * d)
v2 = np.abs(np.sin(xx / W * 9 - yy / H * 6 + warp * 1.4))
veins += np.clip(1 - v2 / 0.02, 0, 1) ** 2 * 0.45 * d
base = np.array([20, 16, 13], np.float32) + (n[..., None] - 0.5) * np.array([26, 20, 15]) + (d[..., None] - 0.5) * 10
img = base + veins[..., None] * np.array([150, 110, 55])
# fine pitting
img += (r.random((H, W, 1)) - 0.5) * 9
out = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
out.save("storefront/public/brand/hero-stone.webp", "WEBP", quality=78, method=6)
print(out.size)
