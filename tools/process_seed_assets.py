"""Turns the raw AI-generated character sheets (white / green background, slightly different size per expression)
into clean transparent sprites that line up perfectly, plus backgrounds, plus a manifest.json for the engine.

Needs:  pip install opencv-python-headless numpy scipy pillow
Usage:  python tools/process_seed_assets.py RAW_DIR OUT_DIR
        RAW_DIR holds files like seedy_1.png ... background_soil.png (unzip your zips into one folder)
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

WHITE = np.array([255, 255, 255], np.float32)
GREEN = np.array([0, 255, 0], np.float32)

CHARS = {  # name: (file prefix, expressions, background colour)
    "seedy": ("seedy", [1, 2, 3, 4, 5], WHITE), "sprouty": ("sprouty", [1, 2, 3, 4, 5], WHITE),
    "bloom": ("bloom", [1, 2, 3, 4, 5], WHITE), "drippy": ("drippy", [1, 2, 3, 4, 5], WHITE),
    "ray": ("sunnyray", [1, 2, 3, 4, 5], WHITE), "cloud": ("cloud", [1, 2, 5], GREEN),
    "soil": ("soil", [1, 2, 5], WHITE), "wiggly": ("wiggly", [1, 2, 5], WHITE),
}
MAX_PX = 760      # longest side of the base body in the output sprite


def cutout(rgb, bg):
    """RGB uint8 -> RGBA float with a clean anti-aliased edge (bg colour is known, so alpha can be solved exactly)."""
    img = rgb.astype(np.float32)
    dist = np.linalg.norm(img - bg, axis=2)
    cand = dist < (40 if bg[1] == 255 and bg[0] == 0 else 28)          # "looks like background"
    lab, n = ndi.label(cand)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    isbg = np.isin(lab, list(border))
    fg = ~isbg
    solid = ndi.binary_erosion(fg, iterations=3)
    idx = ndi.distance_transform_edt(~solid, return_distances=False, return_indices=True)
    F = img[idx[0], idx[1]]                                               # nearest solid colour for every pixel
    d = F - bg
    num = np.sum((img - bg) * d, axis=2)
    den = np.maximum(np.sum(d * d, axis=2), 1e-3)
    a = np.clip(num / den, 0, 1)
    near = ndi.binary_dilation(fg, iterations=2)                          # only trust alpha near the silhouette
    alpha = np.where(solid, 1.0, np.where(near, a, 0.0))
    alpha[alpha < 0.04] = 0
    color = np.where(solid[..., None], img, F)
    if bg[1] == 255 and bg[0] == 0:                                       # remove green spill on the edge
        color[..., 1] = np.minimum(color[..., 1], np.maximum(color[..., 0], color[..., 2]) + 6)
    return np.dstack([color, alpha * 255])


def drop_specks(rgba):
    """Remove detached bits (AI watermark sparkles) far from the main figure."""
    a = rgba[..., 3] > 20
    lab, n = ndi.label(a)
    if n <= 1:
        return rgba
    sizes = ndi.sum(a, lab, range(1, n + 1))
    main = 1 + int(np.argmax(sizes))
    ys, xs = np.where(lab == main)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    pad = 0.04 * max(rgba.shape[:2])
    for i in range(1, n + 1):
        if i == main:
            continue
        cy, cx = ndi.center_of_mass(lab == i)
        if cx < x0 - pad or cx > x1 + pad or cy < y0 - pad or cy > y1 + pad or sizes[i - 1] < 0.0006 * a.size:
            rgba[lab == i, 3] = 0
    return rgba


def bbox(rgba, thr=20):
    ys, xs = np.where(rgba[..., 3] > thr)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def align_to(base, mov):
    """Similarity-ish alignment of `mov` onto `base` (ECC on the silhouettes+shading). Returns warped RGBA."""
    def gray(x):
        a = x[..., 3:4] / 255.0
        g = cv2.cvtColor((x[..., :3] * a + 255 * (1 - a)).astype(np.uint8), cv2.COLOR_RGB2GRAY)
        return cv2.GaussianBlur(g, (0, 0), 2).astype(np.float32) / 255.0
    bb, bm = bbox(base), bbox(mov)
    # initial guess: match bbox bottom-centre and height
    s = (bb[3] - bb[1]) / (bm[3] - bm[1])
    M = np.array([[s, 0, (bb[0] + bb[2]) / 2 - s * (bm[0] + bm[2]) / 2], [0, s, bb[3] - s * bm[3]]], np.float32)
    gb, gm = gray(base), gray(mov)
    try:
        cv2.findTransformECC(gb, gm, M, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), None, 5)
    except cv2.error:
        pass
    h, w = base.shape[:2]
    pm = mov.copy(); pm[..., :3] *= (pm[..., 3:4] / 255.0)
    out = cv2.warpAffine(pm, M, (w, h), flags=cv2.INTER_LANCZOS4 | cv2.WARP_INVERSE_MAP if False else cv2.INTER_LANCZOS4, borderValue=0)
    # M maps base->mov coords for ECC; so use inverse map
    out = cv2.warpAffine(pm, M, (w, h), flags=cv2.INTER_LANCZOS4 | cv2.WARP_INVERSE_MAP, borderValue=0)
    a = np.clip(out[..., 3:4], 1e-3, 255)
    rgb = np.clip(out[..., :3] / (a / 255.0), 0, 255)
    return np.dstack([rgb, np.clip(out[..., 3], 0, 255)])


def match_color(rgba, ref):
    """Shift the body colour of `rgba` to that of `ref` (used for expressions the AI painted in a different shade)."""
    def body(x):
        r = x[..., :3].astype(np.uint8)
        hsv = cv2.cvtColor(r, cv2.COLOR_RGB2HSV).astype(np.float32)
        m = (x[..., 3] > 250) & (hsv[..., 1] > 90) & (hsv[..., 2] > 110) & (hsv[..., 0] > 5) & (hsv[..., 0] < 25)
        return m
    mr, mm = body(ref), body(rgba)
    lab_r = cv2.cvtColor(ref[..., :3].astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
    lab_m = cv2.cvtColor(rgba[..., :3].astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
    if mr.sum() < 500 or mm.sum() < 500:
        return rgba
    shift = lab_r[mr].mean(0) - lab_m[mm].mean(0)
    # weight: strongest on body-coloured pixels, fading for dark outline/eyes/white
    L = lab_m[..., 0]
    w = ndi.gaussian_filter(mm.astype(np.float32), 1.5)
    w = np.maximum(w, np.clip((L - 70) / 60, 0, 1) * np.clip((lab_m[..., 1] - 120) / 15, 0, 1) * .6)
    lab2 = lab_m + shift[None, None, :] * w[..., None]
    rgb = cv2.cvtColor(np.clip(lab2, 0, 255).astype(np.uint8), cv2.COLOR_LAB2RGB).astype(np.float32)
    return np.dstack([rgb, rgba[..., 3]])


def main(raw, out):
    raw, out = Path(raw), Path(out)
    out.mkdir(parents=True, exist_ok=True)
    manifest = {"chars": {}, "bgs": {}}
    for name, (prefix, exprs, bgc) in CHARS.items():
        cut = {}
        for e in exprs:
            p = raw / f"{prefix}_{e}.png"
            rgba = drop_specks(cutout(np.array(Image.open(p).convert("RGB")), bgc))
            cut[e] = rgba
        base = cut[exprs[0]]
        for e in exprs[1:]:
            cut[e] = align_to(base, cut[e])
        if name == "seedy":                                  # expressions 2 & 3 were painted dark brown
            for e in (2, 3):
                cut[e] = match_color(cut[e], base)
        bb = [bbox(cut[e]) for e in exprs]
        x0, y0 = min(b[0] for b in bb), min(b[1] for b in bb)
        x1, y1 = max(b[2] for b in bb), max(b[3] for b in bb)
        base_bb = bbox(base)
        bw, bh = base_bb[2] - base_bb[0], base_bb[3] - base_bb[1]
        sc = min(1.0, MAX_PX / max(bw, bh))
        W, H = int(round((x1 - x0) * sc)), int(round((y1 - y0) * sc))
        for e in exprs:
            crop = cut[e][y0:y1, x0:x1]
            im = Image.fromarray(np.clip(crop, 0, 255).astype(np.uint8), "RGBA").resize((W, H), Image.LANCZOS)
            im.save(out / f"{name}_{e}.png", optimize=True)
        manifest["chars"][name] = {"exprs": exprs, "w": W, "h": H,
                                   "bw": round(bw * sc, 1), "bh": round(bh * sc, 1),                      # base body size in sprite px
                                   "ax": round(((base_bb[0] + base_bb[2]) / 2 - x0) * sc, 1),            # foot anchor (bottom centre)
                                   "ay": round((base_bb[3] - y0) * sc, 1)}
        print(name, W, H, "base body", round(bw * sc), round(bh * sc))
    for key, f in (("soil", "background_soil"), ("sunny", "background_sunny"), ("rainy", "background_rainy")):
        im = Image.open(raw / f"{f}.png").convert("RGB")
        arr = np.array(im)
        h, w = arr.shape[:2]                                  # the AI tool stamps a small sparkle ~120 px from the lower right corner
        m = np.zeros((h, w), np.uint8)
        cv2.circle(m, (w - 122, h - 120), 36, 255, -1)
        arr = cv2.inpaint(arr, m, 7, cv2.INPAINT_TELEA)
        Image.fromarray(arr).save(out / f"bg_{key}.jpg", quality=90, optimize=True)
        manifest["bgs"][key] = {"w": w, "h": h}
    (out / "manifest.json").write_text(json.dumps(manifest, indent=1))
    (out / "manifest.js").write_text("window.SEED_MANIFEST = " + json.dumps(manifest) + ";\n")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
