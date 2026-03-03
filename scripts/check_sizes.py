import os
from PIL import Image

base_dir = r"D:\CRM WEB\PIC-TREE"
bg_path = os.path.join(base_dir, "1.png")
bg_img = Image.open(bg_path)
print(f"1.png size: {bg_img.size}")

for num in range(2, 16):
    layer_name = f"{num}.png"
    layer_path = os.path.join(base_dir, layer_name)
    if os.path.exists(layer_path):
        img = Image.open(layer_path)
        print(f"{layer_name} size: {img.size}")
