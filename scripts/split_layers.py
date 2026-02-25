"""
Layer extraction from background.png (2816x1536)
Color analysis results:
  Clouds:  H_ocv ~97-98, S < 72, V > 225
  Sky:     H_ocv ~92-99, S 60-110, V 200-240
  Trunk:   H_ocv ~20-38, S 60-110, V 100-200
  Roots:   H_ocv ~20-45, S 80-150, V 80-180
  Grass:   H_ocv ~38-58, S > 150, V > 100
"""
import cv2
import numpy as np
import os

SRC = r"D:\CRM WEB\team-progress-tracker\background.png"
OUT = r"D:\CRM WEB\team-progress-tracker\scripts\layers_out"
os.makedirs(OUT, exist_ok=True)

# Load image
orig = cv2.imread(SRC, cv2.IMREAD_UNCHANGED)
bgr = orig[:, :, :3].copy()
h, w = bgr.shape[:2]
hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
H, S, V = hsv[:,:,0], hsv[:,:,1], hsv[:,:,2]

print(f"Image: {w}x{h}")

def keep_blobs(mask, n=1, min_area=500):
    """Keep n largest blobs."""
    nb, labels, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), connectivity=8)
    if nb <= 1:
        return mask
    sizes = stats[1:, cv2.CC_STAT_AREA]
    idx = np.argsort(sizes)[::-1]
    out = np.zeros_like(mask)
    for i in idx[:n]:
        if sizes[i] >= min_area:
            out[labels == i+1] = 255
    return out

def save_layer(name, mask, color_bgr, idx):
    """Save a colored layer overlay on original."""
    vis = bgr.copy()
    result = vis.copy()
    m = mask > 0
    result[m] = np.clip(
        bgr[m].astype(int) * 0.45 + np.array(color_bgr) * 0.55, 0, 255
    ).astype(np.uint8)
    pct = mask.sum() / 255 / (h * w) * 100
    print(f"  Layer {idx} {name}: {pct:.1f}% pixels")
    path = os.path.join(OUT, f"{idx}_{name}.png")
    cv2.imwrite(path, result)
    return mask

# ─── 1. MÂY (Clouds) ────────────────────────────────────────────────────────
# Only the 2 big clouds at top-left and top-right.
# They are white/light-cyan, high V, low S, in the top ~22% of image.
may_mask = (
    (H >= 85) & (H <= 115) &
    (S < 85) &
    (V > 220)
).astype(np.uint8) * 255
# Restrict strictly to top 22% where the 2 big clouds are
may_mask[int(h*0.22):, :] = 0
# Close gaps within each cloud, modest dilate
k50 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (50, 50))
k25 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))
may_mask = cv2.morphologyEx(may_mask, cv2.MORPH_CLOSE, k50)
may_mask = cv2.morphologyEx(may_mask, cv2.MORPH_DILATE, k25)
# Keep only the 2 largest cloud blobs
may_mask = keep_blobs(may_mask, n=2, min_area=20000)
save_layer("may_clouds", may_mask, (200, 230, 255), 1)

# ─── THÂN CÂY (Trunk) ────────────────────────────────────────────────────────
# Scan data: y=42-84% center S=80-90 (low) = trunk bark
# y=86%+ S jumps to 143-222 = roots
# Trunk: y=40-84%, x=44-56% (narrow column), S=55-110
grass_excl = ((H >= 38) & (S > 155)).astype(np.uint8) * 255
than_mask = (
    (H >= 18) & (H <= 44) &
    (S >= 55) & (S <= 110) &
    (V >= 115) & (V <= 220)
).astype(np.uint8) * 255
than_mask[:, :int(w*0.44)] = 0
than_mask[:, int(w*0.56):] = 0
than_mask[:int(h*0.40), :] = 0    # cut canopy (above 40%)
than_mask[int(h*0.84):, :] = 0    # cut at exact trunk/root boundary
than_mask[grass_excl > 0] = 0
k20 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (20, 20))
k12 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (12, 12))
than_mask = cv2.morphologyEx(than_mask, cv2.MORPH_CLOSE, k20)
than_mask = cv2.morphologyEx(than_mask, cv2.MORPH_DILATE, k12)
than_mask = keep_blobs(than_mask, n=1, min_area=2000)
save_layer("than_cay_trunk", than_mask, (140, 100, 200), 2)

# ─── RỄ CÂY (Roots) ─────────────────────────────────────────────────────────
# Scan data: H=30-43, S=145-221, V=100-155 (orange-brown saturated, DARKER than grass)
# Key discriminator vs grass: V < 160 (roots darker), grass V > 145 & brighter green H
re_mask = (
    (H >= 30) & (H <= 46) &
    (S >= 145) & (S <= 225) &
    (V >= 95)  & (V <= 158)   # dark = roots, bright = grass
).astype(np.uint8) * 255
re_mask[:int(h*0.82), :] = 0
re_mask[int(h*0.97):, :] = 0
re_mask[:, :int(w*0.22)] = 0
re_mask[:, int(w*0.78):] = 0
# Exclude only CLEARLY green grass (H>=48 is definitely grass, not root orange)
grass_only = ((H >= 48) & (S > 148)).astype(np.uint8) * 255
re_mask[grass_only > 0] = 0
k30 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (30, 30))
k18 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (18, 18))
re_mask = cv2.morphologyEx(re_mask, cv2.MORPH_CLOSE, k30)
re_mask = cv2.morphologyEx(re_mask, cv2.MORPH_DILATE, k18)
re_mask = keep_blobs(re_mask, n=8, min_area=1500)
save_layer("re_cay_roots", re_mask, (60, 130, 255), 3)

# ─── CỎ (Grass) ───────────────────────────────────────────────────────────────
# Grass: vivid green H_ocv 35-62, S > 148, bottom 45% of image
co_mask = (
    (H >= 35) & (H <= 62) &
    (S > 148) &
    (V > 95)
).astype(np.uint8) * 255
co_mask[:int(h*0.55), :] = 0
k50 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (50, 50))
k30 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (30, 30))
co_mask = cv2.morphologyEx(co_mask, cv2.MORPH_CLOSE, k50)
co_mask = cv2.morphologyEx(co_mask, cv2.MORPH_DILATE, k30)
save_layer("co_grass", co_mask, (50, 220, 80), 4)

# ─── ALL LAYERS COMPOSITE ─────────────────────────────────────────────────────
layers = [
    (may_mask,  (200, 230, 255)),
    (than_mask, (140, 100, 200)),
    (re_mask,   ( 60, 130, 255)),
    (co_mask,   ( 50, 220,  80)),
]
composite = bgr.copy().astype(float)
for mask, col in layers:
    m = mask > 0
    overlay = np.zeros_like(bgr, dtype=float)
    overlay[m] = col
    composite[m] = composite[m] * 0.5 + overlay[m] * 0.5

cv2.imwrite(os.path.join(OUT, "0_ALL_LAYERS.png"), composite.astype(np.uint8))
print("\nSaved to:", OUT)
