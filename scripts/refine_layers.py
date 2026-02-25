"""
refine_layers.py
Script 2: Phân tích màu thực tế trong từng vùng của ảnh,
sau đó tách layer chính xác hơn và output SVG hitbox coordinates.
"""

import os, json
from PIL import Image
import numpy as np

SRC  = r"d:\CRM WEB\team-progress-tracker\public\tree-crm.png"
OUT  = r"d:\CRM WEB\team-progress-tracker\scripts\layers"
os.makedirs(OUT, exist_ok=True)

img  = Image.open(SRC).convert("RGBA")
arr  = np.array(img)
H, W = arr.shape[:2]
R, G, B, A = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]

def rgb2hsv(rr, gg, bb):
    r,g,b = rr/255.0, gg/255.0, bb/255.0
    cmax  = np.maximum(np.maximum(r,g),b)
    cmin  = np.minimum(np.minimum(r,g),b)
    delta = cmax - cmin + 1e-10
    h = np.zeros_like(r)
    s = np.where(cmax==0, 0, delta/cmax)
    v = cmax
    mr=(cmax==r)&(delta>0); mg=(cmax==g)&(delta>0); mb=(cmax==b)&(delta>0)
    h[mr]=(60*((g[mr]-b[mr])/delta[mr]))%360
    h[mg]= 60*((b[mg]-r[mg])/delta[mg])+120
    h[mb]= 60*((r[mb]-g[mb])/delta[mb])+240
    return h, s, v

Hc, Sc, Vc = rgb2hsv(R.astype(float), G.astype(float), B.astype(float))

# ── Helper: sample a region and report dominant HSV bands ────────────────────
def sample_region(name, y1, y2, x1, x2):
    region_h = Hc[y1:y2, x1:x2].flatten()
    region_s = Sc[y1:y2, x1:x2].flatten()
    region_v = Vc[y1:y2, x1:x2].flatten()
    print(f"\n  [{name}] ({y1}:{y2}, {x1}:{x2})")
    for label, arr_v in [("H",region_h),("S",region_s),("V",region_v)]:
        p5,p25,p50,p75,p95 = np.percentile(arr_v, [5,25,50,75,95])
        print(f"    {label}: p5={p5:.1f}  p25={p25:.1f}  median={p50:.1f}  p75={p75:.1f}  p95={p95:.1f}")

print("=" * 65)
print("STEP 1: Sampling expected zone colors from the image")
print("=" * 65)

# Sky top-right (where rain should be)
sample_region("Rain zone (top-right)",  0, int(H*0.3),  int(W*0.55), W)
# Sky top-left (where wind/clouds should be)
sample_region("Wind zone (top-left)",   0, int(H*0.35), 0, int(W*0.35))
# Middle of tree (canopy center)
sample_region("Canopy center",  int(H*0.2), int(H*0.6), int(W*0.3), int(W*0.7))
# Trunk center
sample_region("Trunk center",   int(H*0.5), int(H*0.9), int(W*0.40), int(W*0.60))
# Bottom roots
sample_region("Root/ground",    int(H*0.75), H,          int(W*0.3), int(W*0.7))

# ── STEP 2: Refined masks ─────────────────────────────────────────────────────
print("\n" + "=" * 65)
print("STEP 2: Refined layer masks")
print("=" * 65)

def save_layer(name, mask, desc=""):
    out = arr.copy()
    out[:,:,3] = np.where(mask, 255, 0)
    Image.fromarray(out.astype(np.uint8)).save(os.path.join(OUT, f"r_{name}.png"))
    pct = round(float(mask.sum())/(H*W)*100, 1)
    rows = np.any(mask, axis=1); cols = np.any(mask, axis=0)
    if rows.any() and cols.any():
        ry = [int(np.where(rows)[0].min()), int(np.where(rows)[0].max())]
        rx = [int(np.where(cols)[0].min()), int(np.where(cols)[0].max())]
    else:
        ry = rx = [0, 0]
    # SVG coords (scale to 900 wide)
    sx = 900/W
    sy = 900/W   # same scale (uniform)
    svg_y = [round(ry[0]*sy), round(ry[1]*sy)]
    svg_x = [round(rx[0]*sx), round(rx[1]*sx)]
    print(f"  [r_{name:20s}] {pct:5.1f}%  px_y:{ry}  px_x:{rx}")
    print(f"    {'':20s}         svg_y:{svg_y}  svg_x:{svg_x}  ({desc})")
    return {"layer":name,"pct":pct,"px_bbox":{"y":ry,"x":rx},"svg_bbox":{"y":svg_y,"x":svg_x},"note":desc}

results = []

# Sky (blue-ish background)
sky = (
    ((Hc>=190)&(Hc<=230)&(Sc<0.55)&(Vc>0.60)) |
    ((Sc<0.10)&(Vc>0.85))   # near-white
)
results.append(save_layer("sky",      sky,      "Sky background"))

# Clouds (fluffy white-light-teal)
clouds = ((Sc<0.28)&(Vc>0.78)) | ((Hc>=175)&(Hc<=215)&(Sc<0.40)&(Vc>0.70))
clouds &= ~sky
results.append(save_layer("clouds",   clouds,   "Cloud puffs"))

# Rain — look specifically in right half, upper portion; bright high-V blue-grey
rain_zone = np.zeros((H,W), bool)
rain_zone[:int(H*0.40), int(W*0.45):] = True
rain = rain_zone & (Hc>=190)&(Hc<=240)&(Sc>=0.05)&(Sc<=0.45)&(Vc>=0.55)&(Vc<=0.95)
results.append(save_layer("rain",     rain,     "Rain (right cloud zone)"))

# Wind — left portion, upper third, light cyan/teal wisps
wind_zone = np.zeros((H,W), bool)
wind_zone[:int(H*0.50), :int(W*0.40)] = True
wind = wind_zone & (Hc>=150)&(Hc<=210)&(Sc>=0.05)&(Sc<=0.55)&(Vc>=0.50)
wind &= ~clouds & ~sky
results.append(save_layer("wind",     wind,     "Wind (left cloud zone)"))

# Canopy / leaves — greens (full tree, not just top)
canopy = (Hc>=50)&(Hc<=165)&(Sc>=0.18)&(Vc>=0.12)&(Vc<=0.88)
results.append(save_layer("canopy",   canopy,   "Canopy / leaves"))

# Branches — brown mid-value
branches = (Hc>=12)&(Hc<=42)&(Sc>=0.22)&(Sc<=0.82)&(Vc>=0.22)&(Vc<=0.72) & ~canopy
results.append(save_layer("branches", branches, "Branches"))

# Trunk — dark brown (lower value)
trunk = (Hc>=8)&(Hc<=50)&(Sc>=0.12)&(Sc<=0.80)&(Vc>=0.08)&(Vc<=0.50) & ~canopy
results.append(save_layer("trunk",    trunk,    "Trunk (full vertical)"))

# Roots — trunk pixels in bottom 45% of image
root_zone = np.zeros((H,W), bool); root_zone[int(H*0.55):, :] = True
roots = trunk & root_zone
results.append(save_layer("roots",    roots,    "Roots (trunk in lower zone)"))

# Grass / ground — dark greens + earth tones in bottom 42%
ground_zone = np.zeros((H,W), bool); ground_zone[int(H*0.58):, :] = True
grass = ground_zone & (
    ((Hc>=60)&(Hc<=135)&(Sc>=0.15)&(Vc<0.55)) |
    ((Hc>=18)&(Hc<=65)&(Sc>=0.18)&(Vc<0.45))
)
results.append(save_layer("grass",    grass,    "Grass & ground"))

# ── STEP 3: Compute SVG clickable bounding paths ──────────────────────────────
print("\n" + "=" * 65)
print("STEP 3: SVG Hitbox coordinates (900-wide viewBox)")
print("=" * 65)

sx = 900/W   # ~0.4186

def compute_hitbox(mask, zone_name, simplify_rows=8):
    """Create a simplified polygon path from a binary mask."""
    rows = np.where(np.any(mask, axis=1))[0]
    if not len(rows): return None
    y0, y1 = int(rows.min()), int(rows.max())
    points_left  = []
    points_right = []
    step = max(1, (y1-y0)//simplify_rows)
    for y in range(y0, y1+1, step):
        cols = np.where(mask[y])[0]
        if len(cols):
            points_left.append( (round(cols.min()*sx), round(y*sx)) )
            points_right.append((round(cols.max()*sx), round(y*sx)) )
    if not points_left: return None
    path_pts = points_left + list(reversed(points_right))
    path_d = "M" + " L".join(f"{x},{y}" for x,y in path_pts) + " Z"
    print(f"\n  {zone_name}:")
    print(f"    Path: {path_d[:120]}{'...' if len(path_d)>120 else ''}")
    # Also computed simplified rect
    all_x = [p[0] for p in path_pts]; all_y = [p[1] for p in path_pts]
    print(f"    BBox: x={min(all_x)}-{max(all_x)}  y={min(all_y)}-{max(all_y)}")
    return path_d

hitboxes = {}
for layer_name, mask in [
    ("trunk",   trunk),
    ("roots",   roots),
    ("canopy",  canopy),
    ("grass",   grass),
]:
    p = compute_hitbox(mask, layer_name)
    if p: hitboxes[layer_name] = p

# ── Save full JSON report ─────────────────────────────────────────────────────
report = {
    "image": {"width": W, "height": H},
    "svg_scale": {"viewBox": f"0 0 900 {round(900*H/W)}", "sx": round(sx,6)},
    "layers": results,
    "hitboxes_svg_d": hitboxes,
}
with open(os.path.join(OUT, "refined_report.json"), "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2, ensure_ascii=False)

print(f"\n✅ Refined layers saved → {OUT}")
print(f"   JSON report → {OUT}/refined_report.json")
