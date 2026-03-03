import cv2
import numpy as np
import os
import json
from PIL import Image as PILImage

# For massive image sizes
PILImage.MAX_IMAGE_PIXELS = None

base_dir = r"D:\CRM WEB\PIC-TREE"
out_dir = r"d:\CRM WEB\team-progress-tracker\public\pic_aligned"
report_dir = r"d:\CRM WEB\team-progress-tracker\scripts"

os.makedirs(out_dir, exist_ok=True)

# 1. Load reference image
ref_path = os.path.join(base_dir, "1.png")
print("Loading reference image...")
ref_img = cv2.imread(ref_path)
if ref_img is None:
    print(f"Cannot load {ref_path}")
    exit()

h_full, w_full = ref_img.shape[:2]

# Scale down for faster feature matching
SCALE = 0.25
ref_small = cv2.resize(ref_img, (0, 0), fx=SCALE, fy=SCALE, interpolation=cv2.INTER_AREA)
ref_gray_small = cv2.cvtColor(ref_small, cv2.COLOR_BGR2GRAY)

print("Extracting SIFT features from reference...")
sift = cv2.SIFT_create()
kp_ref, des_ref = sift.detectAndCompute(ref_gray_small, None)

FLANN_INDEX_KDTREE = 1
index_params = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
search_params = dict(checks=50)
flann = cv2.FlannBasedMatcher(index_params, search_params)

report = {
    "original_size": {"width": w_full, "height": h_full},
    "viewBox": f"0 0 {w_full} {h_full}",
    "layers": []
}

for i in range(2, 16):
    layer_name = f"{i}.png"
    layer_path = os.path.join(base_dir, layer_name)
    if not os.path.exists(layer_path):
        continue
        
    print(f"\n[{layer_name}] Aligning...")
    # Read with alpha
    layer_img = cv2.imread(layer_path, cv2.IMREAD_UNCHANGED)
    if layer_img is None:
        print(f"  Cannot load {layer_path}")
        continue
        
    layer_small = cv2.resize(layer_img, (0, 0), fx=SCALE, fy=SCALE, interpolation=cv2.INTER_AREA)
    
    if layer_small.shape[2] == 4:
        bgr_small = layer_small[:, :, :3]
        alpha_small = layer_small[:, :, 3]
    else:
        bgr_small = layer_small
        alpha_small = np.ones(bgr_small.shape[:2], dtype=np.uint8) * 255
        
    _, mask_small = cv2.threshold(alpha_small, 10, 255, cv2.THRESH_BINARY)
    gray_small = cv2.cvtColor(bgr_small, cv2.COLOR_BGR2GRAY)
    
    kp_layer, des_layer = sift.detectAndCompute(gray_small, mask_small)
    print(f"  Found {len(kp_layer)} keypoints.")
    
    if des_layer is None or len(des_layer) < 10:
        print(f"  Not enough features in {layer_name}")
        continue
        
    matches = flann.knnMatch(des_layer, des_ref, k=2)
    
    good_matches = []
    for m in matches:
        if len(m) == 2:
            m1, m2 = m
            if m1.distance < 0.75 * m2.distance:
                good_matches.append(m1)
                
    print(f"  Good matches: {len(good_matches)}")
    
    if len(good_matches) > 10:
        src_pts = np.float32([kp_layer[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        dst_pts = np.float32([kp_ref[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        
        M_small, inliers = cv2.estimateAffinePartial2D(src_pts, dst_pts, cv2.RANSAC)
        
        if M_small is not None:
            # Reconstruct the scale correctly:
            # In scaling by SCALE (e.g. 0.25):
            # p_small = SCALE * p_full
            # q_small = SCALE * q_full
            # M_small maps p_small -> q_small
            # q_small = A_small * p_small + t_small
            # SCALE * q_full = A_small * (SCALE * p_full) + t_small
            # q_full = A_small * p_full + t_small / SCALE
            # So the rotation/scaling block A remains the SAME!
            # Only translation t needs dividing by SCALE!
            M = M_small.copy()
            M[0, 2] = M[0, 2] / SCALE
            M[1, 2] = M[1, 2] / SCALE
            
            print(f"  Transform matrix full scale:\n{M}")
            
            # Warp full image
            aligned = cv2.warpAffine(layer_img, M, (w_full, h_full), borderMode=cv2.BORDER_CONSTANT, borderValue=(0,0,0,0))
            
            # Crop to bounding box
            aligned_alpha = aligned[:, :, 3]
            coords = cv2.findNonZero(aligned_alpha)
            if coords is not None:
                x, y, w_crop, h_crop = cv2.boundingRect(coords)
                cropped = aligned[y:y+h_crop, x:x+w_crop]
                
                out_name = f"aligned_{i}.png"
                out_path = os.path.join(out_dir, out_name)
                
                # Use PIL for saving
                cropped_rgba = cv2.cvtColor(cropped, cv2.COLOR_BGRA2RGBA)
                rgb_img = PILImage.fromarray(cropped_rgba)
                rgb_img.save(out_path, optimize=True)
                
                report["layers"].append({
                    "id": out_name,
                    "x": int(x),
                    "y": int(y),
                    "width": int(w_crop),
                    "height": int(h_crop),
                    "source": layer_name
                })
                print(f"  ✅ Saved {out_name} (x:{x}, y:{y}, w:{w_crop}, h:{h_crop})")
            else:
                print(f"  Failed: Warped alpha channel is empty.")
        else:
            print(f"  Failed to find affine transform.")
    else:
        print(f"  Less than 10 good matches.")

report_path = os.path.join(report_dir, "pic_aligned_report.json")
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2, ensure_ascii=False)

print("\n🎉 Tất cả hoàn thành! Tọa độ ghép lưu tại:", report_path)
