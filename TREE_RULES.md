# 🌳 Corporate Growth Tree Dashboard — Toàn bộ Rules & Thiết kế

> File này lưu trữ toàn bộ quy tắc thiết kế, dữ liệu, logic tương tác và metaphor của component `EcosystemTree.tsx`.  
> **Mục đích:** Không bị quên khi build lại từ đầu.

---

## 1. Triết lý tổng thể (Philosophy)

Cây tăng trưởng doanh nghiệp (Corporate Growth Tree) là **metaphor trực quan** cho sức khỏe tổ chức:

| Bộ phận cây | Ý nghĩa thực tế |
|---|---|
| 🌧 **Mưa / Rain** (phải) | Thiên thời — cơ hội thị trường, timing đúng lúc |
| 💨 **Gió / Wind** (trái) | Marketing — gió thuận chiều đưa thương hiệu đi xa |
| ☁️ **Mây phải** | "Timely Opportunity / Thiên thời" — môi trường kinh doanh thuận lợi |
| ☁️ **Mây trái** | "Marketing" — lực đẩy truyền thông |
| 🌿 **Tán lá / Canopy** | 5 phòng ban chính — mỗi nhánh = 1 phòng ban |
| 🪵 **Thân cây / Trunk** | Technology Core — nền tảng kỹ thuật, dẫn đến 30 dự án |
| 🌱 **Rễ cây / Roots** | Personnel System / Hệ thống nhân sự (HR) — nền tảng con người |
| 🌍 **Mặt đất / Ground** | Partner Block — 4 nhóm đối tác chiến lược |
| 🏪 **Dưới mặt đất** | The Market — thị trường tổng thể (consumers, B2B, etc.) |

---

## 2. Dimensions & SVG Coordinate System

```
SVG viewBox: 0 0 900 700
Tỉ lệ ảnh nền: xMidYMid slice (fill, không distort)
Ảnh nền: /tree.png (AI-generated corporate tree visual)
```

### Phân vùng theo Y:
| Y start | Y end | Zone |
|---|---|---|
| 0 | 50 | Rain clouds / Thiên thời badge |
| 50 | 400 | Canopy — nhánh cây, branch cards |
| 230 | 600 | Trunk click zone |
| 400 | 560 | Lower trunk |
| 555 | 640 | Roots zone |
| 642 | 695 | Partner labels (ground level) |
| 695 | 700 | "THE MARKET" footer text |

---

## 3. Dữ liệu 5 Phòng Ban (Teams)

| ID | Tên | Màu hex | Icon | Ý nghĩa nhánh |
|---|---|---|---|---|
| `tech` | Technology | `#6366f1` | ⚙️ | Thân cây + nhánh |
| `mkt` | Marketing | `#ec4899` | 📣 | Nhánh + gió/mây trái |
| `hr` | Human Resources | `#f59e0b` | 👥 | Rễ cây + nhánh |
| `partnerships` | Partnerships | `#10b981` | 🤝 | Nhánh |
| `assistant` | Assistant/BOD | `#3b82f6` | 📋 | Nhánh |

### Rule sort nhánh:
Teams **tự động sắp xếp theo % tiến độ giảm dần** → team tiến độ cao nhất vào nhánh quan trọng nhất (top-right = slot 0).

---

## 4. Branch Slots — Vị trí nhánh trong SVG (900×700)

| Slot | SVG (x,y) | Hướng card | Team index | Vị trí trên cây |
|---|---|---|---|---|
| 0 | (610, 130) | right | teamData[0] — tốt nhất | Nhánh cao phải |
| 1 | (290, 155) | left  | teamData[1] | Nhánh cao trái |
| 2 | (590, 240) | right | teamData[2] | Nhánh giữa phải |
| 3 | (250, 265) | left  | teamData[3] | Nhánh giữa trái |
| 4 | (230, 355) | left  | teamData[4] — yếu nhất | Nhánh thấp trái |

---

## 5. Click Zones (Invisible SVG paths)

### Trunk Zone (Thân cây → 30 dự án)
```
Path: M410,230 L490,230 L500,600 L400,600 Z
Action: mở modal danh sách 30 dự án
Hover effect: gradient fill rgba(99,102,241,0.20) + stroke indigo
```

### Roots Zone (Rễ cây → HR)
```
Path: M310,570 C360,555 440,550 490,552 C540,550 610,555 640,570 L650,640 C600,625 530,618 450,618 C370,618 300,625 260,640 Z
Action: router.push("/teams/hr")
Hover effect: gradient fill rgba(245,158,11,0.20) + stroke amber
```

---

## 6. Weather Animations

### Rain (Mưa — Thiên thời)
- **Vùng**: x: 658–770, y: 40–145 (góc phải, trên mây phải)
- **Số giọt**: 20
- **Animation**: `rain-sv` — translate(-5px, +35px) + fade in/out
- **Duration**: 0.70s – 0.90s (staggered)
- **Stroke**: Light blue rgba(99,136,219,0.62)

Tọa độ 20 giọt mưa (SVG):
```
[658,40],[672,55],[686,35],[700,60],[714,42],[728,50],[742,38],[756,62],
[663,90],[680,100],[697,85],[715,95],[732,80],[749,98],[660,140],[690,130],
[710,145],[735,125],[752,138],[770,118]
```

### Wind (Gió — Marketing)
- **Vùng**: x: 98–115, y: 185–338 (góc trái, mây trái)
- **Số luồng**: 6
- **Animation**: `wind-sv` — scaleX + translateX + fade in/out
- **Duration**: 1.7s – 2.6s (staggered)

Tọa độ 6 luồng gió (SVG):
```
{ x:108, y:185, w:55 }
{ x:100, y:215, w:68 }
{ x:112, y:248, w:48 }
{ x:98,  y:278, w:60 }
{ x:105, y:308, w:52 }
{ x:115, y:338, w:44 }
```

---

## 7. Floating Labels (Badges)

### Marketing Badge (mây trái)
```
Position: x=98, y=58 | size: 112×30
Animation: float-u (lên xuống 3.5s)
Text: "📢 Marketing"
Color: #2563eb (light) / #93c5fd (dark)
```

### Thiên thời / Timely Opportunity Badge (mây phải)
```
Position: x=628, y=30 | size: 160×42
Animation: float-u 0.9s delay
Text line 1: "⏱ Timely Opportunity"
Text line 2: "(Thiên thời)"
Color: #4338ca (light) / #a5b4fc (dark)
```

---

## 8. Labels cố định trong SVG

### Personnel System (trên rễ)
```
Position: x=345, y=595 | size: 210×28
Text: "🌱 Personnel System"
Border: amber — đổi màu khi hover roots
```

### Partner Block Labels (4 nhóm, y=642–673)
| Index | Center X | Label | Sub | Icon | Color |
|---|---|---|---|---|---|
| 0 | 100 | Suppliers | Nhà cung cấp HH & DV | 📦 | `#f59e0b` |
| 1 | 280 | HR Partners | Đối tác nhân sự | 👥 | `#8b5cf6` |
| 2 | 580 | Knowledge/Experience Partners | Kiến thức & trải nghiệm | 🎓 | `#10b981` |
| 3 | 790 | Financial Partners | Đối tác tài chính | 💰 | `#3b82f6` |

### Footer text (y=695)
```
"THE MARKET · Thị trường  ·  PARTNER BLOCK · Khối Đối Tác"
fontSize: 9, letterSpacing: 2.5, opacity: ~50%
```

---

## 9. Branch Card (BranchCard component)

Mỗi card hiển thị bằng SVG thuần (`<rect>` + `<text>`, không dùng `<foreignObject>`):

```
Card size: 130×72 px (SVG)
Card bg: rgba(8,15,26,0.90) dark / rgba(255,255,255,0.94) light
Border: team.color khi active, rgba(180,210,240,0.80) khi bình thường
Shadow: drop-shadow(0 0 8px {color}55) khi active

Nội dung trong card:
  Row 1 (y+20): {icon} {team.name}  [fontSize=12, bold]
  Row 2 (y+27): progress bar bg (full width - 20px)
  Row 2 (y+27): progress bar fill (width proportional to %)
  Row 3 (y+48): {progress}%  |  {health.icon} {health.text}
  Row 4 (y+62): {growthLabel}  [fontSize=8.5]

Connector line:
  Từ mép card → vào thân nhánh (dashed khi bình thường, solid khi active)
```

---

## 10. Health Logic (Sức khỏe)

```typescript
const Q1_ELAPSED = 54  // ngày đã qua trong quý
const Q1_TOTAL   = 89  // tổng số ngày quý 1
const EXPECTED   = Math.round(54/89 * 100)  // = 61%

function healthLabel(progress: number) {
  const ratio = progress / EXPECTED
  if (ratio >= 0.80) → 🟢 "Đúng tiến độ"  #10b981
  if (ratio >= 0.50) → 🟡 "Hơi chậm"      #f59e0b
  else               → 🔴 "Nguy hiểm"     #ef4444
}
```

---

## 11. Growth Label (Trạng thái tăng trưởng)

```typescript
function growthLabel(progress: number) {
  >= 100 → "🎉 Đơm quả"
  >= 80  → "🌸 Ra hoa"
  >= 50  → "🌿 Xum xuê"
  >= 20  → "🌱 Đang mọc"
  else   → "🪵 Khô"
}
```

---

## 12. Lushness (Độ xanh tổng thể)

```
ecosystem = trung bình cộng progress của tất cả 5 teams
Hiển thị: progress bar header + badge "🌿 Health: X%"
```

---

## 13. Side Panel / Bottom Sheet (Chi tiết team)

Khi click vào branch card:
- **Desktop**: Panel 300px trượt ra bên phải (flex layout)
- **Mobile**: Bottom sheet trượt lên từ dưới (fixed, max-height 72vh)

**Nội dung panel:**
1. Header: icon + tên team + growthLabel + % + nút "↗ Chi tiết" + "← Về cây"
2. Progress bar với marker kỳ vọng (EXPECTED%)
3. Task list (tối đa 8 tasks, hiện done/doing/pending + quá hạn)
4. Activity log (tối đa 5 entries)

---

## 14. Trunk Modal (30 Dự án)

Click vào thân cây → Modal full:
- Header: "⚙️ Technology — 30 Dự Án"
- List: 15 dự án mẫu (PROJECTS_SAMPLE) + note "+15 dự án đang lên kế hoạch"
- Click outside hoặc ✕ để đóng

**PROJECTS_SAMPLE (15 items):**
```
01 GSX Mobile App          | tech        | active
02 AI Recommendation Engine| tech        | active
03 CRM Integration         | tech        | active
04 Data Analytics Platform | tech        | active
05 Cloud Infrastructure    | tech        | inactive
06 Brand Campaign Q1       | mkt         | active
07 Social Media Automation | mkt         | active
08 Content Marketing Hub   | mkt         | inactive
09 Talent Acquisition System| hr         | active
10 E-learning Platform     | hr          | active
11 HR Analytics Dashboard  | hr          | inactive
12 Strategic Alliance A    | partnerships| active
13 Market Expansion SEA    | partnerships| active
14 B2B Partnership Portal  | partnerships| inactive
15 Executive Reporting Suite| assistant  | active
```

---

## 15. Dark Mode

Toggle button ở top bar: "🌙 Dark" / "☀ Light"

| Element | Light | Dark |
|---|---|---|
| Background | `#f0f7ff` | `#080f1a` |
| Text main | `#0f172a` | `#f1f5f9` |
| Text sub | `#64748b` | `#94a3b8` |
| Panel bg | `#ffffff` | `#0e1c34` |
| Border | `#c7dff5` | `#1a3660` |
| SVG overlay | none | `rgba(0,0,0,0.42)` |

---

## 16. Responsive (Mobile / Desktop)

```
Breakpoint: 768px (window.innerWidth < 768 = isMobile)

Desktop:
  - Layout: SVG (flex:1) + side panel (300px) cạnh nhau
  - Top bar: full info ngang
  - Hint: "🌿 Hover nhánh · Click nhánh..."

Mobile:
  - Layout: SVG full width, panel = bottom sheet fixed
  - Top bar: 2 hàng gọn, ẩn lushness bar, font nhỏ hơn
  - Bottom sheet: max-height 72vh + drag handle + backdrop
  - Hint: "👆 Tap nhánh = chi tiết..."
```

---

## 17. CSS Animations (keyframes)

```css
rain-sv   : translate(0→-5px, 0→+35px) + fade   | linear, 0.7-0.9s
wind-sv   : scaleX(0.2→1→0.4) + translateX       | ease-in-out, 1.7-2.6s
float-u   : translateY(0→-6px→0)                 | ease-in-out, 3.5s
breathe   : opacity(0.35→0.70→0.35)              | ease-in-out, 2.8s
sheet-up  : translateY(100%→0)                   | cubic-bezier, 0.32s
```

---

## 18. File Structure

```
components/
  EcosystemTree.tsx         ← Component chính (~680-730 lines)

public/
  tree.png                  ← Ảnh AI cây (version cũ)
  tree-crm.png              ← Ảnh CRM cây (version mới - đang build)

TREE_RULES.md               ← File này
```

---

## 19. Tọa độ SVG thực đo từ tree-crm.png (Python analysis)

> **Script**: `scripts/analyze_tree.py` + `scripts/refine_layers.py` + `scripts/visualize_layers.py`  
> **Ngày đo**: build session 2026-02-25  
> **Ảnh gốc**: 2150×1266 px → scale = 0.4186 → **SVG viewBox: `0 0 900 530`**

### Layer detection kết quả:

| Layer | % pixels | SVG x | SVG y | Ghi chú |
|---|---|---|---|---|
| Sky | 16.3% | 0–900 | 25–419 | Background xanh nhạt |
| Clouds | 16.5% | 0–900 | 21–495 | Mây trắng, lan rộng |
| **Rain** | **0.4%** | **563–716** | **105–150** | Rất nhỏ, top-right corner |
| **Wind** | **0.1%** | **226–356** | **122–265** | Rất nhỏ, top-left area |
| Canopy | 32.1% | 0–900 | 109–530 | Tán lá — chiếm nhiều nhất |
| Branches | 5.2% | 0–898 | 170–530 | Cành cây brown |
| Trunk | 3.2% | 10–900 | 167–530 | Thân (rộng vì kèm rễ) |
| Roots | 2.3% | 10–900 | 291–530 | Rễ (bottom 45%) |
| Grass | 11.8% | 0–900 | 307–530 | Cỏ + mặt đất |

### Quan trọng — Rain & Wind rất nhỏ:
- Rain (mưa) chỉ 0.4% ảnh — nằm ở góc **top-right** `x:563-716, y:105-150`
- Wind (gió) chỉ 0.1% — nằm ở **left center** `x:226-356, y:122-265`
- Kết luận: **rain và wind trong ảnh rất subtle** → khi rebuild nên vẽ thêm bằng SVG animation thay vì tách từ ảnh

### Files đã tạo:
```
scripts/
  analyze_tree.py           ← script lần 1
  refine_layers.py          ← script lần 2 (refined)
  visualize_layers.py       ← tạo ảnh visualization
  layers/
    r_sky.png, r_clouds.png, r_rain.png, r_wind.png
    r_canopy.png, r_branches.png, r_trunk.png, r_roots.png, r_grass.png
    layer_visualization.png  ← preview tất cả layers

public/
  layer_visualization.png   ← accessible qua /layer_visualization.png
  layers/                   ← individual layer PNGs (accessible qua /layers/)
```

---

## 20. TODO — Việc cần làm khi build lại (updated)

- [ ] Xác định chính xác tọa độ các vùng click (trunk, roots, branches) so với ảnh `tree-crm.png`
- [ ] Đo kích thước thực tế của ảnh `tree-crm.png` để điều chỉnh viewBox
- [ ] Vẽ lại BRANCH_SLOTS phù hợp với layout của ảnh mới
- [ ] Vẽ lại TRUNK_ZONE path theo thân cây trong ảnh mới
- [ ] Vẽ lại ROOTS_ZONE path theo rễ cây trong ảnh mới
- [ ] Điều chỉnh RAIN_SVG / WIND_SVG tọa độ theo vị trí mây trong ảnh mới
- [ ] Điều chỉnh Partner label positions (cx values) theo layout ground mới
- [ ] Test mobile rendering
- [ ] Test dark mode overlay strength

---

*Last updated: build session — xóa sạch và rebuild từ ảnh `tree-crm.png`*
