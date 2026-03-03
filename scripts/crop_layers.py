import os
import json
import numpy as np
from PIL import Image

# Tăng giới hạn kích thước ảnh cho hình ảnh cực lớn
Image.MAX_IMAGE_PIXELS = None

SRC_DIR = r"D:\CRM WEB\PIC-TREE"
OUT_DIR = r"d:\CRM WEB\team-progress-tracker\public\pic_layers"
REPORT_DIR = r"d:\CRM WEB\team-progress-tracker\scripts"

os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(REPORT_DIR, exist_ok=True)

# 1.png là ảnh nền
bg_path = os.path.join(SRC_DIR, "1.png")
if not os.path.exists(bg_path):
    print("Không tìm thấy 1.png")
    exit(1)

bg_img = Image.open(bg_path)
W, H = bg_img.size
print(f"Kích thước gốc: {W}x{H}\n")

report = {
    "original_size": {"width": W, "height": H},
    "viewBox": f"0 0 {W} {H}",
    "layers": []
}

for i in range(2, 16):
    layer_name = f"{i}.png"
    layer_path = os.path.join(SRC_DIR, layer_name)
    if not os.path.exists(layer_path):
        continue
        
    img = Image.open(layer_path).convert("RGBA")
    arr = np.array(img)
    alpha = arr[:, :, 3]
    
    # Tìm bounding box của các pixel không trong suốt
    rows = np.any(alpha > 0, axis=1)
    cols = np.any(alpha > 0, axis=0)
    
    if not rows.any() or not cols.any():
        print(f"[{layer_name}] hoàn toàn trong suốt, bỏ qua.")
        continue
        
    ymin, ymax = np.where(rows)[0][[0, -1]]
    xmin, xmax = np.where(cols)[0][[0, -1]]
    
    # Crop
    cropped = img.crop((xmin, ymin, xmax + 1, ymax + 1))
    
    # Lưu
    out_name = f"layer_{i}.png"
    out_path = os.path.join(OUT_DIR, out_name)
    cropped.save(out_path, optimize=True)
    
    w_crop = xmax - xmin + 1
    h_crop = ymax - ymin + 1
    
    layer_info = {
        "id": out_name,
        "x": int(xmin),
        "y": int(ymin),
        "width": int(w_crop),
        "height": int(h_crop),
        "source": layer_name
    }
    report["layers"].append(layer_info)
    print(f"[{layer_name}] -> {out_name} | x:{xmin} y:{ymin} w:{w_crop} h:{h_crop}")

report_path = os.path.join(REPORT_DIR, "pic_layers_report.json")
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2, ensure_ascii=False)

print(f"\n✅ Hoàn thành! Đã lưu ảnh con tại: {OUT_DIR}")
print(f"✅ Báo cáo tọa độ lưu tại: {report_path}")
