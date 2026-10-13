"""
Cuts the client's bottle renders (GK_mockup_Bottles.pdf, one per page, on white) into web layers:
  public/bottles/<slug>.webp       whole bottle, transparent
  public/bottles/<slug>-body.webp  bottle without the cap (cap lifts off in the animations)
  public/bottles/<slug>-cap.webp   the cap on its own, same canvas size so they line up
Usage: python3 tools/cut_bottles.py <folder of page renders p01.png..p16.png> <storefront/public/bottles>
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ORDER = [
    "eventus", "imagine", "kings-code", "midnight-elixir", "angels-pour", "althaire", "baccara-rouge", "nomad",
    "noir-orchid", "royal-oud", "lost-berry", "symphonie", "amber-levant", "delina-rose", "empress-bloom", "royal-musk",
]
src, out = Path(sys.argv[1]), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
meta = {}

for i, slug in enumerate(ORDER):
    rgb = np.asarray(Image.open(src / f"p{i + 1:02d}.png").convert("RGB")).astype(np.float32)
    whiteness = rgb.min(axis=2)
    # background = near-white pixels connected to the border
    near = whiteness > 243
    lab, _ = ndimage.label(near)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    fg = ~bg
    fg = ndimage.binary_fill_holes(fg)
    # soft edge: a 2px band where alpha follows how far from white the pixel is
    band = ndimage.binary_dilation(fg, iterations=2) & ~ndimage.binary_erosion(fg, iterations=1)
    alpha = fg.astype(np.float32)
    soft = np.clip((255 - whiteness) / 40.0, 0, 1)
    alpha[band] = np.maximum(soft[band], alpha[band] * 0.0 + soft[band])
    alpha = np.where(ndimage.binary_erosion(fg, iterations=1), 1.0, alpha)
    # remove the white fringe: un-mix from the white background
    a = np.clip(alpha, 1e-3, 1)[..., None]
    col = np.clip((rgb - (1 - a) * 255) / a, 0, 255)

    ys, xs = np.where(alpha > 0.05)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    pad = 8
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(rgb.shape[1], x1 + pad), min(rgb.shape[0], y1 + pad)
    rgba = np.dstack([col, alpha * 255]).astype(np.uint8)[y0:y1, x0:x1]
    A = rgba[..., 3] > 128

    # cap split: the cap's flared black collar narrows down onto a straight neck ring.
    widths = A.sum(axis=1)
    h = len(widths)
    top = np.argmax(widths > 0)
    shoulders = top + np.argmax(widths[top:] > widths.max() * 0.9)  # first row of the full-width glass
    cap_zone = widths[top:shoulders]
    widest = int(np.argmax(cap_zone[: len(cap_zone) // 2]))  # the gold band (upper half of the cap zone)
    neck_w = cap_zone[widest:].min()  # narrowest part below it = the neck ring
    # first row below the gold band that is as narrow as the neck ring -> bottom of the cap
    split = top + widest + int(np.argmax(cap_zone[widest:] <= neck_w * 1.02))
    body = rgba.copy()
    body[:split, :, 3] = 0
    cap = rgba.copy()
    cap[split:, :, 3] = 0

    W, H = rgba.shape[1], rgba.shape[0]
    target_h = 900
    size = (round(W * target_h / H), target_h)
    for name, arr in [(slug, rgba), (f"{slug}-body", body), (f"{slug}-cap", cap)]:
        Image.fromarray(arr).resize(size, Image.LANCZOS).save(out / f"{name}.webp", "WEBP", quality=86, method=6)
    # where the neck ring sits, for drawing the atomiser when the cap is off (fractions of the canvas)
    ring = split + max(4, (shoulders - split) // 3)  # a row through the middle of the neck ring
    cols = np.where(A[ring])[0]
    meta[slug] = {
        "w": size[0], "h": size[1],
        "capBottom": round(float(split) / H, 4),  # top of the neck ring = where the atomiser starts
        "neckX": round(float(cols.min() + cols.max()) / 2 / W, 4),  # centre of the neck
        "neckW": round(float(cols.max() - cols.min()) / W, 4),
        "shoulders": round(float(shoulders) / H, 4),
    }
    print(slug, size, meta[slug])

(out / "bottles.json").write_text(json.dumps(meta, indent=1))
