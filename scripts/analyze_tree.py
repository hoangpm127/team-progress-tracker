"""
analyze_tree.py
Phân tích ảnh tree-crm.png và tách các layer thành file PNG riêng.
Output: scripts/layers/ chứa các file PNG với alpha channel.
"""

import os
import json
from PIL import Image
import numpy as np

SRC  = r"d:\CRM WEB\team-progress-tracker\public\tree-crm.png"
OUT  = r"d:\CRM WEB\team-progress-tracker\scripts\layers"
os.makedirs(OUT, exist_ok=True)

img    = Image.open(SRC).convert("RGBA")
arr    = np.array(img)          # shape: (H, W, 4) — R,G,B,A
H, W   = arr.shape[:2]
R, G, B = arr[:,:,0], arr[:,:,1], arr[:,:,2]

# ── Convert to HSV for easier color segmentation ─────────────────────────────
def rgb2hsv(r, g, b):
    """Vectorised RGB→HSV. Returns H[0-360], S[0-1], V[0-1]."""
    r, g, b = r/255.0, g/255.0, b/255.0
    cmax = np.maximum(np.maximum(r, g), b)
    cmin = np.minimum(np.minimum(r, g), b)
    delta = cmax - cmin + 1e-10

    h = np.zeros_like(r)
    s = np.where(cmax == 0, 0, delta / cmax)
    v = cmax

    mask_r = (cmax == r) & (delta > 0)
    mask_g = (cmax == g) & (delta > 0)
    mask_b = (cmax == b) & (delta > 0)

    h[mask_r] = (60 * ((g[mask_r] - b[mask_r]) / delta[mask_r])) % 360
    h[mask_g] = 60 * ((b[mask_g] - r[mask_g]) / delta[mask_g]) + 120
    h[mask_b] = 60 * ((r[mask_b] - g[mask_b]) / delta[mask_b]) + 240
    return h, s, v

H_ch, S_ch, V_ch = rgb2hsv(R.astype(float), G.astype(float), B.astype(float))

# ── Helper to save a masked layer ────────────────────────────────────────────
def save_layer(name, mask, note=""):
    out_arr = arr.copy()
    out_arr[:,:,3] = np.where(mask, 255, 0)
    Image.fromarray(out_arr.astype(np.uint8)).save(os.path.join(OUT, f"{name}.png"))
    count  = int(mask.sum())
    pct    = round(count / (H*W) * 100, 1)
    # bounding box
    rows   = np.any(mask, axis=1)
    cols   = np.any(mask, axis=0)
    rmin, rmax = (int(np.where(rows)[0].min()), int(np.where(rows)[0].max())) if rows.any() else (0,0)
    cmin, cmax = (int(np.where(cols)[0].min()), int(np.where(cols)[0].max())) if cols.any() else (0,0)
    print(f"  [{name:20s}]  {pct:5.1f}% pixels  bbox y:{rmin}-{rmax}  x:{cmin}-{cmax}  {note}")
    return { "layer": name, "pct": pct, "y": [rmin, rmax], "x": [cmin, cmax], "note": note }

print(f"\n🌳 Analyzing {W}×{H} image\n{'─'*70}")

results = []

# ── 1. SKY — light blue/white background (top zone) ─────────────────────────
sky_mask = (
    (H_ch >= 185) & (H_ch <= 230) &    # blue-cyan hue
    (S_ch < 0.50) &                     # low saturation (pale)
    (V_ch > 0.70)                       # bright
) | (
    (S_ch < 0.12) & (V_ch > 0.88)      # near-white
)
results.append(save_layer("1_sky", sky_mask, "Sky & background"))

# ── 2. CLOUDS — white/very-light areas ───────────────────────────────────────
cloud_mask = (
    (S_ch < 0.18) &
    (V_ch > 0.82) &
    (~sky_mask)    # exclude already-categorised sky
) | (
    (H_ch >= 195) & (H_ch <= 225) &
    (S_ch < 0.35) & (V_ch > 0.75)
)
results.append(save_layer("2_clouds", cloud_mask, "Clouds (white puffs)"))

# ── 3. RAIN — blue-grey diagonal streaks ─────────────────────────────────────
rain_mask = (
    (H_ch >= 195) & (H_ch <= 240) &
    (S_ch >= 0.15) & (S_ch <= 0.60) &
    (V_ch >= 0.45) & (V_ch <= 0.80)
)
results.append(save_layer("3_rain", rain_mask, "Rain streaks"))

# ── 4. WIND — light teal/cyan wisps ──────────────────────────────────────────
wind_mask = (
    (H_ch >= 160) & (H_ch <= 200) &
    (S_ch >= 0.10) & (S_ch <= 0.50) &
    (V_ch > 0.65)
) & (~cloud_mask) & (~sky_mask)
results.append(save_layer("4_wind", wind_mask, "Wind wisps"))

# ── 5. CANOPY / LEAVES — greens ──────────────────────────────────────────────
canopy_mask = (
    (H_ch >= 60) & (H_ch <= 160) &
    (S_ch >= 0.20) &
    (V_ch >= 0.15) & (V_ch <= 0.85)
)
results.append(save_layer("5_canopy", canopy_mask, "Canopy / leaves (greens)"))

# ── 6. BRANCHES — medium brown ───────────────────────────────────────────────
branch_mask = (
    (H_ch >= 15) & (H_ch <= 45) &
    (S_ch >= 0.25) & (S_ch <= 0.80) &
    (V_ch >= 0.25) & (V_ch <= 0.75)
) & (~canopy_mask)
results.append(save_layer("6_branches", branch_mask, "Branches (brown)"))

# ── 7. TRUNK — dark brown / near-black wood ──────────────────────────────────
trunk_mask = (
    (H_ch >= 10) & (H_ch <= 50) &
    (S_ch >= 0.15) & (S_ch <= 0.75) &
    (V_ch >= 0.10) & (V_ch <= 0.45)
) & (~canopy_mask)
results.append(save_layer("7_trunk", trunk_mask, "Trunk (dark brown)"))

# ── 8. ROOTS — very dark brown, bottom half of image ─────────────────────────
root_zone  = np.zeros((H, W), dtype=bool)
root_zone[int(H*0.60):, :] = True         # only look in bottom 40%
roots_mask = trunk_mask & root_zone
results.append(save_layer("8_roots", roots_mask, "Roots (trunk bottom zone)"))

# ── 9. GRASS / GROUND — dark greens + earth ──────────────────────────────────
grass_mask = (
    (H_ch >= 70) & (H_ch <= 130) &
    (S_ch >= 0.20) &
    (V_ch < 0.40)
) | (
    (H_ch >= 20) & (H_ch <= 60) &   # earthy brown-green
    (S_ch >= 0.25) &
    (V_ch < 0.38)
)
grass_mask = grass_mask & root_zone
results.append(save_layer("9_grass_ground", grass_mask, "Grass & ground (bottom)"))

# ── 10. FULL COMPOSITE CHECK — save a heatmap of uncategorised pixels ────────
categorised = (sky_mask | cloud_mask | canopy_mask | branch_mask | trunk_mask | grass_mask)
unknown = ~categorised
results.append(save_layer("0_uncategorised", unknown, "Pixels not matched by any rule"))

# ── Save JSON report ──────────────────────────────────────────────────────────
report = {
    "image": { "width": W, "height": H },
    "svgViewBox_900x": {
        "scaleX": round(900/W, 6),
        "scaleY": round(900/W * H/W * (W/900), 6),
        "note":   f"Multiply y-coords by {round(H/W,4)} to get SVG y when viewBox=900x{round(900*H/W)}"
    },
    "layers": results
}
with open(os.path.join(OUT, "report.json"), "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2, ensure_ascii=False)

print(f"\n✅ Done — layers saved to: {OUT}")
print(f"   SVG viewBox suggestion: 0 0 900 {round(900*H/W)}")
print(f"   Scale factor x: {round(900/W, 4)}  (multiply pixel coords by this)")
