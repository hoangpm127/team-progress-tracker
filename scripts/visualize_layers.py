"""
visualize_layers.py
Tạo 1 ảnh composite hiển thị tất cả layers với màu overlay khác nhau,
để dễ kiểm tra vị trí các vùng đã tách.
"""

import os
from PIL import Image, ImageDraw, ImageFont
import numpy as np

SRC  = r"d:\CRM WEB\team-progress-tracker\public\tree-crm.png"
OUT  = r"d:\CRM WEB\team-progress-tracker\scripts\layers"
PUB  = r"d:\CRM WEB\team-progress-tracker\public"

img  = Image.open(SRC).convert("RGBA")
arr  = np.array(img)
H, W = arr.shape[:2]
R,G,B,A = arr[:,:,0],arr[:,:,1],arr[:,:,2],arr[:,:,3]

def rgb2hsv(rr,gg,bb):
    r,g,b=rr/255.,gg/255.,bb/255.
    cmax=np.maximum(np.maximum(r,g),b); cmin=np.minimum(np.minimum(r,g),b)
    delta=cmax-cmin+1e-10
    h=np.zeros_like(r); s=np.where(cmax==0,0,delta/cmax); v=cmax
    mr=(cmax==r)&(delta>0); mg=(cmax==g)&(delta>0); mb=(cmax==b)&(delta>0)
    h[mr]=(60*((g[mr]-b[mr])/delta[mr]))%360
    h[mg]=60*((b[mg]-r[mg])/delta[mg])+120
    h[mb]=60*((r[mb]-g[mb])/delta[mb])+240
    return h,s,v

Hc,Sc,Vc=rgb2hsv(R.astype(float),G.astype(float),B.astype(float))

# ── Define layers + overlay colors ───────────────────────────────────────────
sky     =(((Hc>=190)&(Hc<=230)&(Sc<0.55)&(Vc>0.60))|((Sc<0.10)&(Vc>0.85)))
clouds  =((Sc<0.28)&(Vc>0.78))|((Hc>=175)&(Hc<=215)&(Sc<0.40)&(Vc>0.70)); clouds&=~sky
rzone   =np.zeros((H,W),bool); rzone[:int(H*.40),int(W*.45):]=True
rain    =rzone&(Hc>=190)&(Hc<=240)&(Sc>=0.05)&(Sc<=0.45)&(Vc>=0.55)&(Vc<=0.95)
wzone   =np.zeros((H,W),bool); wzone[:int(H*.50),:int(W*.40)]=True
wind    =wzone&(Hc>=150)&(Hc<=210)&(Sc>=0.05)&(Sc<=0.55)&(Vc>=0.50); wind&=~clouds&~sky
canopy  =(Hc>=50)&(Hc<=165)&(Sc>=0.18)&(Vc>=0.12)&(Vc<=0.88)
branches=(Hc>=12)&(Hc<=42)&(Sc>=0.22)&(Sc<=0.82)&(Vc>=0.22)&(Vc<=0.72)&~canopy
trunk   =(Hc>=8)&(Hc<=50)&(Sc>=0.12)&(Sc<=0.80)&(Vc>=0.08)&(Vc<=0.50)&~canopy
rtz     =np.zeros((H,W),bool); rtz[int(H*.55):,:]=True
roots   =trunk&rtz
gz      =np.zeros((H,W),bool); gz[int(H*.58):,:]=True
grass   =gz&(((Hc>=60)&(Hc<=135)&(Sc>=0.15)&(Vc<0.55))|((Hc>=18)&(Hc<=65)&(Sc>=0.18)&(Vc<0.45)))

layers_vis = [
    ("Sky",      sky,      (135, 206, 250, 100)),   # light blue
    ("Clouds",   clouds,   (255, 255, 255, 120)),   # white
    ("Rain",     rain,     ( 30, 144, 255, 200)),   # blue
    ("Wind",     wind,     (  0, 255, 220, 200)),   # cyan
    ("Canopy",   canopy,   ( 34, 139,  34, 120)),   # green
    ("Branches", branches, (139,  90,  43, 180)),   # brown
    ("Trunk",    trunk,    ( 80,  40,  10, 200)),   # dark brown
    ("Roots",    roots,    (180, 100,   0, 220)),   # amber
    ("Grass",    grass,    ( 0,  80,   0, 180)),    # dark green
]

# Scale down to 900 wide for output
scale = 900/W
out_w = 900
out_h = round(H * scale)
base  = img.resize((out_w, out_h), Image.LANCZOS)
overlay = Image.new("RGBA", (out_w, out_h), (0,0,0,0))
draw    = ImageDraw.Draw(overlay)

for name, mask, rgba in layers_vis:
    # Downscale mask
    mask_img = Image.fromarray((mask*255).astype(np.uint8), "L").resize((out_w,out_h), Image.NEAREST)
    mask_arr = np.array(mask_img) > 128
    color_layer = np.zeros((out_h, out_w, 4), dtype=np.uint8)
    color_layer[mask_arr] = rgba
    overlay_part = Image.fromarray(color_layer, "RGBA")
    overlay = Image.alpha_composite(overlay, overlay_part)

    # Draw label at centroid
    rows = np.where(np.any(mask_arr, axis=1))[0]
    cols = np.where(np.any(mask_arr, axis=0))[0]
    if rows.any() and cols.any():
        cy = int(rows.mean()); cx = int(cols.mean())
        draw.ellipse([cx-4,cy-4,cx+4,cy+4], fill=(255,255,255,255))
        draw.text((cx+7, cy-8), name, fill=(255,255,255,255))

# Composite: base + overlay
result = Image.alpha_composite(base.convert("RGBA"), overlay)

# Save for inspection
vis_path = os.path.join(OUT, "layer_visualization.png")
result.save(vis_path)
print(f"✅ Visualization saved: {vis_path}")

# Also copy all layer PNGs to public for SVG use
print("\n📂 Layer PNGs in scripts/layers/:")
for fname in sorted(os.listdir(OUT)):
    if fname.endswith(".png"):
        size = os.path.getsize(os.path.join(OUT, fname))
        print(f"   {fname:40s}  {size//1024:6d} KB")

# ── Generate final SVG coordinates summary ───────────────────────────────────
sx = 900/W
print(f"\n📐 SVG ViewBox: 0 0 900 {round(900*H/W)}")
print(f"   Scale: px × {sx:.4f} = SVG unit\n")

for name, mask, _ in layers_vis:
    rows = np.any(mask, axis=1); cols = np.any(mask, axis=0)
    if rows.any() and cols.any():
        ry=[int(np.where(rows)[0].min()),int(np.where(rows)[0].max())]
        rx=[int(np.where(cols)[0].min()),int(np.where(cols)[0].max())]
        sy=[round(ry[0]*sx),round(ry[1]*sx)]
        sx2=[round(rx[0]*sx),round(rx[1]*sx)]
        print(f"  {name:10s}: svg x={sx2[0]}-{sx2[1]:3d}  y={sy[0]}-{sy[1]:3d}")
