"""
Export 6 layer regions from tree-crm.png as individual PNG files.
SVG viewBox 0 0 900 530  →  image 2150x1266 px
Scale: sx = 2150/900 = 2.3889,  sy = 1266/530 = 2.3887
"""
from PIL import Image, ImageDraw
import os, math

SRC = r"D:\CRM WEB\team-progress-tracker\tree-crm.png"
OUT = r"D:\CRM WEB\team-progress-tracker\scripts\layers_out"
os.makedirs(OUT, exist_ok=True)

img = Image.open(SRC).convert("RGBA")
W, H = img.size          # 2150 x 1266
SX = W / 900.0           # 2.3889
SY = H / 530.0           # 2.3887

def sv(x, y):            # SVG coord → pixel coord
    return (round(x * SX), round(y * SY))

def sr(x, y, w, h):      # SVG rect → pixel rect (x0,y0,x1,y1)
    x0, y0 = sv(x, y)
    x1, y1 = sv(x+w, y+h)
    return (x0, y0, x1, y1)

# ── draw helper ───────────────────────────────────────────────────────────────
ALPHA = 160   # overlay opacity

def make_layer(name, color_rgb, draw_fn):
    """
    Create output image: original + semi-transparent colored overlay on region.
    Also saves a cropped tight version.
    """
    base = img.copy()
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    draw_fn(d, color_rgb)
    combined = Image.alpha_composite(base, overlay)
    path = os.path.join(OUT, f"{name}.png")
    combined.save(path)
    print(f"  ✓  {name}.png  →  {path}")

# ── 1. Mây (clouds merged — 2 cloud blobs) ───────────────────────────────────
def draw_clouds(d, c):
    r = (*c, ALPHA)
    # Left cloud: SVG ellipse-like — centre (185,108), rx=145, ry=78
    cx, cy = sv(185, 108)
    rx, ry = round(145*SX), round(78*SY)
    d.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill=r)
    # Right cloud: centre (695,95), rx=165, ry=82
    cx, cy = sv(695, 95)
    rx, ry = round(165*SX), round(82*SY)
    d.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill=r)

make_layer("1_may_clouds", (34, 211, 238), draw_clouds)

# ── 2. Gió (wind — left zone) ────────────────────────────────────────────────
def draw_wind(d, c):
    d.rounded_rectangle(sr(58, 98, 268, 188), radius=round(30*SX),
                        fill=(*c, ALPHA))

make_layer("2_gio_wind", (6, 182, 212), draw_wind)

# ── 3. Mưa (rain — right zone) ───────────────────────────────────────────────
def draw_rain(d, c):
    d.rounded_rectangle(sr(524, 72, 202, 158), radius=round(24*SX),
                        fill=(*c, ALPHA))

make_layer("3_mua_rain", (96, 165, 250), draw_rain)

# ── 4. Thân cây (trunk) ──────────────────────────────────────────────────────
def draw_trunk(d, c):
    d.rounded_rectangle(sr(400, 296, 100, 178), radius=round(10*SX),
                        fill=(*c, ALPHA))

make_layer("4_than_cay_trunk", (167, 139, 250), draw_trunk)

# ── 5. Rễ cây (roots — spreading from trunk base) ───────────────────────────
def draw_roots(d, c):
    r = (*c, ALPHA)
    # Left root arm
    left = [sv(424,468), sv(360,470), sv(300,478), sv(248,494),
            sv(228,508), sv(235,524), sv(262,520), sv(298,510),
            sv(346,500), sv(390,490), sv(428,488)]
    d.polygon(left, fill=r)
    # Right root arm
    right = [sv(476,468), sv(540,470), sv(600,478), sv(652,494),
             sv(672,508), sv(665,524), sv(638,520), sv(602,510),
             sv(554,500), sv(510,490), sv(472,488)]
    d.polygon(right, fill=r)
    # Center tap root
    cx0, cy0 = sv(445, 468)
    cx1, cy1 = sv(455, 528)
    d.rectangle([cx0, cy0, cx1, cy1], fill=r)

make_layer("5_re_cay_roots", (251, 146, 60), draw_roots)

# ── 6. Cỏ & Hoa lá (grass / ground cover) ───────────────────────────────────
def draw_grass(d, c):
    d.rectangle(sr(0, 470, 900, 60), fill=(*c, ALPHA))

make_layer("6_co_grass", (52, 211, 153), draw_grass)

# ── Combined overview ─────────────────────────────────────────────────────────
base = img.copy()
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(overlay)
draw_clouds(d, (34, 211, 238))
draw_wind(d, (6, 182, 212))
draw_rain(d, (96, 165, 250))
draw_trunk(d, (167, 139, 250))
draw_roots(d, (251, 146, 60))
draw_grass(d, (52, 211, 153))
combined = Image.alpha_composite(base, overlay)
combined.save(os.path.join(OUT, "0_ALL_LAYERS.png"))
print("  ✓  0_ALL_LAYERS.png (tổng hợp)")

print("\nDone! Files saved to:", OUT)
