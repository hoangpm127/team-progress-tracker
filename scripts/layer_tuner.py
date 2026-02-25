"""
Interactive Layer Tuner - kéo slider để chỉnh HSV + vùng x/y
Phím: S = lưu | N = layer tiếp | Q = thoát
Chạy: python layer_tuner.py [1|2|3|4]
  1 = Mây   2 = Thân   3 = Rễ   4 = Cỏ
"""
import cv2
import numpy as np
import os, sys

SRC = r"D:\CRM WEB\team-progress-tracker\background.png"
OUT = r"D:\CRM WEB\team-progress-tracker\scripts\layers_out"
os.makedirs(OUT, exist_ok=True)

orig = cv2.imread(SRC, cv2.IMREAD_UNCHANGED)
bgr  = orig[:, :, :3].copy()
IH, IW = bgr.shape[:2]
hsv  = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
Hc, Sc, Vc = hsv[:,:,0], hsv[:,:,1], hsv[:,:,2]

# Display scale (fit to 1280 wide)
DW = 1280
DH = int(IH * DW / IW)
bgr_d = cv2.resize(bgr, (DW, DH))

LAYERS = [
    {
        "name": "1_may_clouds", "color": (200, 230, 255),
        "H_min":85,"H_max":115,"S_min":0, "S_max":85,
        "V_min":220,"V_max":255,"y_min":0,"y_max":22,"x_min":0,"x_max":100,
    },
    {
        "name": "2_than_cay_trunk", "color": (140, 100, 200),
        "H_min":18,"H_max":44,"S_min":55,"S_max":110,
        "V_min":115,"V_max":220,"y_min":40,"y_max":84,"x_min":44,"x_max":56,
    },
    {
        "name": "3_re_cay_roots", "color": (40, 120, 255),
        "H_min":30,"H_max":46,"S_min":145,"S_max":225,
        "V_min":100,"V_max":158,"y_min":84,"y_max":97,"x_min":22,"x_max":78,
    },
    {
        "name": "4_co_grass", "color": (50, 220, 80),
        "H_min":35,"H_max":62,"S_min":148,"S_max":255,
        "V_min":95,"V_max":255,"y_min":55,"y_max":100,"x_min":0,"x_max":100,
    },
]

SLIDERS = [
    ("H_min", 0, 179), ("H_max", 0, 179),
    ("S_min", 0, 255), ("S_max", 0, 255),
    ("V_min", 0, 255), ("V_max", 0, 255),
    ("y_min", 0, 100), ("y_max", 0, 100),
    ("x_min", 0, 100), ("x_max", 0, 100),
]

def nothing(_): pass

def build_mask(p):
    m = (
        (Hc >= p["H_min"]) & (Hc <= p["H_max"]) &
        (Sc >= p["S_min"]) & (Sc <= p["S_max"]) &
        (Vc >= p["V_min"]) & (Vc <= p["V_max"])
    ).astype(np.uint8) * 255
    y0 = int(IH * p["y_min"] / 100)
    y1 = int(IH * p["y_max"] / 100)
    x0 = int(IW * p["x_min"] / 100)
    x1 = int(IW * p["x_max"] / 100)
    out = np.zeros_like(m)
    out[y0:y1, x0:x1] = m[y0:y1, x0:x1]
    return out

def render_frame(mask, color, p, name):
    d = bgr_d.copy()
    ms = cv2.resize(mask, (DW, DH), interpolation=cv2.INTER_NEAREST)
    m = ms > 0
    d[m] = np.clip(bgr_d[m].astype(int) * 0.35 + np.array(color) * 0.65, 0, 255).astype(np.uint8)
    # boundary box
    y0 = int(DH * p["y_min"] / 100)
    y1 = int(DH * p["y_max"] / 100)
    x0 = int(DW * p["x_min"] / 100)
    x1 = int(DW * p["x_max"] / 100)
    cv2.rectangle(d, (x0, y0), (x1, y1), (0, 255, 255), 2)
    pct = mask.sum() / 255 / (IH * IW) * 100
    # HUD text
    cv2.rectangle(d, (0, 0), (DW, 70), (0, 0, 0), -1)
    cv2.putText(d, f"Layer: {name}   Coverage: {pct:.1f}%", (10, 28),
                cv2.FONT_HERSHEY_SIMPLEX, 0.85, (0, 255, 255), 2)
    cv2.putText(d, "[ S ] Save    [ N ] Next layer    [ Q ] Quit", (10, 58),
                cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
    return d

def save_layer(mask, color, name):
    k30 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (30, 30))
    k18 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (18, 18))
    m2 = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k30)
    m2 = cv2.morphologyEx(m2, cv2.MORPH_DILATE, k18)
    result = bgr.copy()
    mm = m2 > 0
    result[mm] = np.clip(bgr[mm].astype(int) * 0.35 + np.array(color) * 0.65, 0, 255).astype(np.uint8)
    path = os.path.join(OUT, f"{name}.png")
    cv2.imwrite(path, result)
    pct = m2.sum() / 255 / (IH * IW) * 100
    print(f"  [Saved] {name}.png  ({pct:.1f}%)")

def run(layer_idx):
    layer = LAYERS[layer_idx].copy()
    name  = layer["name"]
    color = layer["color"]
    p = {k: layer[k] for k in layer if k not in ("name","color")}

    WIN = f"Tuner [{layer_idx+1}/4]: {name}"
    cv2.namedWindow(WIN, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(WIN, DW, DH + 320)

    # Must imshow BEFORE createTrackbar on Windows
    cv2.imshow(WIN, bgr_d)
    cv2.waitKey(1)

    for sl, lo, hi in SLIDERS:
        cv2.createTrackbar(sl, WIN, int(p[sl]), int(hi), nothing)
    cv2.waitKey(50)

    print(f"\n>>> Layer {layer_idx+1}: {name}")
    print("    S=Save  N=Next layer  Q=Quit\n")

    while True:
        # Closed by X button?
        try:
            vis = cv2.getWindowProperty(WIN, cv2.WND_PROP_VISIBLE)
        except:
            vis = 0
        if vis < 1:
            break

        for sl, _, _ in SLIDERS:
            try:
                p[sl] = cv2.getTrackbarPos(sl, WIN)
            except:
                break

        mask  = build_mask(p)
        frame = render_frame(mask, color, p, name)
        cv2.imshow(WIN, frame)

        key = cv2.waitKey(30) & 0xFF
        if key in (ord('q'), ord('Q'), 27):   # Q or ESC
            print(f"\n--- Params [{name}] ---")
            for k, v in p.items():
                print(f"  {k}: {v}")
            cv2.destroyWindow(WIN)
            break
        elif key in (ord('s'), ord('S')):
            save_layer(mask, color, name)
        elif key in (ord('n'), ord('N')):
            cv2.destroyWindow(WIN)
            cv2.waitKey(100)
            next_idx = (layer_idx + 1) % len(LAYERS)
            run(next_idx)
            return

# ── Entry ────────────────────────────────────────────────────────────────────
idx = 0
if len(sys.argv) > 1 and sys.argv[1].isdigit():
    idx = max(0, min(int(sys.argv[1]) - 1, len(LAYERS) - 1))

print("="*50)
print("LAYER TUNER")
print("="*50)
for i, L in enumerate(LAYERS):
    marker = ">>>" if i == idx else "   "
    print(f"  {marker} [{i+1}] {L['name']}")
print()
run(idx)
cv2.destroyAllWindows()
