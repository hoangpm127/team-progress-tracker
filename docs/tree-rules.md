# 🌳 THIÊN–ĐỊA–NHÂN ECOSYSTEM TREE — 14-RULE SPEC

> **File:** `components/TreeCanvas.tsx`  
> **ViewBox:** `0 0 1000 700` · Ground Y = 560 · Trunk center X = 500  
> **Last audit:** 2026-02-25 · Git HEAD `7b157f5`

---

## TRẠNG THÁI TỔNG QUAN

| Rule | Tên | Trạng thái |
|------|-----|-----------|
| I    | Silhouette tổng thể | ✅ Đạt |
| II   | Đất / Thị trường    | ✅ Đạt |
| III  | Rễ cây (HR)         | ✅ Đạt |
| IV   | Thân cây (Tech)     | ⚠️ Một phần |
| V    | Cành cây            | ⚠️ Một phần |
| VI   | Lá SVG              | ✅ Đạt |
| VII  | Hoa / Quả milestone | ✅ Đạt |
| VIII | Mây                 | ✅ Đạt |
| IX   | Cỏ (Partnerships)   | ⚠️ Một phần |
| X    | Mưa                 | ⚠️ Một phần |
| XI   | Sức khỏe hệ sinh thái | ❌ Chưa làm |
| XII  | Animation           | ⚠️ Một phần |
| XIII | Nền & bố cục        | ✅ Đạt |
| XIV  | Ba tầng Thiên–Địa–Nhân | ✅ Đạt |

---

## RULE I — SILHOUETTE TỔNG THỂ ✅

**Yêu cầu:**
- Trục đứng rõ ràng: rễ → thân → tán
- Một thân cây duy nhất
- Rễ hiện ra ở phần đất
- Đường đất (ground line) phân tách rõ phần trên và dưới đất
- Tán cây có dạng gần tam giác khi nhìn tổng thể

**Hiện trạng:** Đạt — thân S-curve, rễ amber rõ, ground line tại `GY=560`.

---

## RULE II — ĐẤT / THỊ TRƯỜNG ✅

**Yêu cầu:**
- Đất nằm dưới thân cây
- Màu đất thay đổi theo **Market Index** (`app.market.marketIndex`)
- Click vào vùng đất → mở panel Thị trường
- Có hiệu ứng chiều sâu (đá cuội, màu tối dần xuống dưới)

**Implementation:**
```ts
// Soil gradient — màu thay đổi theo mkIdx
hsl(26, ${36 + mkIdx * 0.08}%, ${20 + mkIdx * 0.05}%)
```

**Hiện trạng:** Đạt — gradient đất động, click zone, nhãn "THỊ TRƯỜNG (ĐẤT)".

---

## RULE III — RỄ CÂY (HR) ✅

**Yêu cầu:**
- Rễ mọc ra từ gốc thân
- Đường cong tự nhiên, không thẳng 90°
- Nằm trong/trên vùng đất
- Màu khác biệt hẳn với thân (hiện: amber `#b45309`)
- Click → mở panel Nhân sự

**TODO (chưa làm):**
- [ ] Độ dày rễ tỷ lệ với `hrP` (HR progress %)

**Hiện trạng:** Đạt cơ bản — 5 đường rễ amber, label "Nhân Sự (Rễ)".

---

## RULE IV — THÂN CÂY (TECH) ⚠️

**Yêu cầu:**
- Gradient không phẳng (có chiều sâu ánh sáng)
- Texture vỏ cây (bark pattern)
- Click → mở danh sách dự án công nghệ
- ⚠️ **Độ rộng thân** tỷ lệ với `techP` (chưa làm)
- ⚠️ **Chiều cao thân** tỷ lệ với số dự án `live` (chưa làm)
- ⚠️ **Growth rings** — mỗi dự án live = 1 vân gỗ trong thân (chưa làm)

**Current path (organic S-curve):**
```
M 444,560 C 440,468 474,382 487,312
C 488,290 488,270 489,258
L 513,258 C 514,268 515,288 516,316
C 528,384 560,470 556,560 Z
```

**TODO:**
- [ ] `TRUNK_TW` và `TRUNK_BW` động theo `techP`
- [ ] Vẽ growth rings (`<ellipse>`) theo số dự án live
- [ ] `TRUNK_TOP_Y` dịch lên khi có nhiều dự án live

---

## RULE V — CÀNH CÂY ⚠️

**Yêu cầu:**
- Cành mọc từ thân, không góc 90°
- Đường cong tự nhiên (bezier)
- Bất đối xứng (trái ≠ phải)
- ⚠️ **Độ dày** và **độ dài** cành tỷ lệ với `progress` của team tương ứng (chưa làm)

**Hiện trạng:** Đạt cơ bản — S-curve, bất đối xứng (left fork `y=290`, right fork `y=278`). Left có 1 nhánh phụ, right không có.

**TODO:**
- [ ] `branchPath` width `w0,w1` tính từ `pianoP`, `asstP`, `techP`
- [ ] Branch length `bLen` tính từ progress

---

## RULE VI — LÁ SVG ✅

**Yêu cầu:**
- Lá = hình giọt nước / oval nhọn SVG — **không dùng emoji, không cartoon**
- Cluster ở đầu nhánh / rìa tán
- Số lá tỷ lệ với `stats.done` (task hoàn thành)
- Lá xanh = bình thường (`#aee84e` → `#88d636`)
- Lá vàng = task quá hạn (`#fcd34d`, xoay nghiêng +42°)
- Phân bổ ngẫu nhiên có seed (deterministic)

**Component:** `OrganicCanopy({cx, cy, prog, color, done, overdue, seed})`

**Màu lá:**
```ts
LEAF_BRIGHT = ["#aee84e","#bef460","#c8f472","#9ee040","#d0f47a","#8cd83a"]
LEAF_MID    = ["#7cc82c","#88d636","#68be1e","#74ca28","#6ab820"]
```

**TODO:**
- [ ] CSS keyframe `leafPop` (scale + fade) khi task mới được check done

---

## RULE VII — HOA / QUẢ MILESTONE ✅

**Yêu cầu:**
- **Hoa** xuất hiện khi `prog >= 80%` — 6 cánh ellipse trắng/vàng + nhụy vàng
- **Quả** xuất hiện khi `prog === 100%` — hình cầu gradient cam→đỏ + cuống lá
- Glow effect (`feDropShadow`) tại milestone
- Một hoa/quả mỗi tán — không rải rác

**Component:** `FlowerTip({cx, cy, prog})`

**Gradient quả:**
```xml
<radialGradient id="fruitG" cx="38%" cy="32%">
  #ff9a3c → #e85c00 → #aa2800
</radialGradient>
```

---

## RULE VIII — MÂY ✅

**Yêu cầu:**
- Hai đám mây: **trái = Marketing**, **phải = Thiên Thời**
- Nằm phía trên tán cây
- Bán trong suốt, dạng wispy (nhiều circle nhỏ chồng nhau)
- Tô màu nhạt theo progress: mây trái có tint hồng (`mktP`), mây phải có tint xanh (`hvIdx`)
- Click → mở MiniPopup tương ứng
- Float animation (lên xuống nhẹ)
- **Không cartoon** — không outline cứng, không quá tròn

**TODO:**
- [ ] Hiệu ứng gió → lá cây đung đưa (wind lines hiện là horizontal strokes, chưa tác động lá)

---

## RULE IX — CỎ (PARTNERSHIPS) ⚠️

**Yêu cầu:**
- Cỏ dọc đường đất, density tỷ lệ với `partP` (partner count)
- Click → mở danh sách đối tác
- ⚠️ **4 loại cỏ** tương ứng 4 nhóm đối tác — màu/shape khác nhau (chưa làm)

**Hiện trạng:** Đạt cơ bản — Q-bezier blades, density động, 5 shade xanh.

**TODO:**
- [ ] Phân vùng 4 nhóm: `📦 Nhà cung cấp`, `👥 HR Partners`, `🎓 Kiến thức`, `💰 Tài chính`
- [ ] Mỗi nhóm = 1 vùng cỏ riêng với màu/shape đặc trưng

---

## RULE X — MƯA ⚠️

**Yêu cầu:**
- Rain animation — hạt mưa rơi xiên
- Toggle on/off qua button
- **Không quá nặng** — mưa mảnh, thưa
- ⚠️ Khi mưa → cây **sáng lên tạm thời** (chưa làm)

**Hiện trạng:** Đạt cơ bản — 26 drops, animation `rainFall`, toggle.

**TODO:**
- [ ] Khi `rainOn === true`: thêm `brightness(1.08)` filter tạm thời lên `.tree-grp`

---

## RULE XI — SỨC KHỎE HỆ SINH THÁI ❌

**Yêu cầu (chưa làm toàn bộ):**
- Tính **weighted health score** = tổng hợp progress của tất cả teams theo trọng số
- Hiển thị score dạng badge/indicator trên cây
- Khi score < 40% → cây **giảm màu sắc** (desaturate + slight grayscale)

**Formula đề xuất:**
```
healthScore = (techP*0.30 + hrP*0.20 + pianoP*0.15 + asstP*0.15 + mktP*0.10 + partP*0.10)
```

**TODO:**
- [ ] Tính `healthScore` trong component
- [ ] `<filter id="healthFilter">` với `feColorMatrix` desaturate khi < 40%
- [ ] Badge nhỏ góc trên tán (hoặc trên thân) hiển thị score

---

## RULE XII — ANIMATION ⚠️

**Yêu cầu:**
- ✅ Sway: `rotate(-1deg) ↔ rotate(1deg)`, 5.5s, ease-in-out — **không bounce**
- ✅ Cloud float: `floatL` 7.5s, `floatR` 9s
- ✅ Rain fall: `rainFall` linear
- ⚠️ **Leaf grow** — khi task mới được done: lá scale+fade in (chưa làm)
- ⚠️ **Branch lengthen** — khi progress tăng: nhánh kéo dài nhẹ (chưa làm)

**TODO:**
- [ ] Lắng nghe state change `techS.done`, `pianoS.done`, etc. → trigger `.leaf-new` class
- [ ] CSS `@keyframes branchGrow` với `stroke-dashoffset`

---

## RULE XIII — NỀN & BỐ CỤC ✅

**Yêu cầu:**
- Nền sạch — không quá sặc sỡ
- Drop shadow nhẹ cho cây
- Depth layering: mây sau → cành sau → tán → thân → cành trước → lá → cành lên từ thân
- Không có element thừa

**Sky gradient (muted):**
```
#7eaec4 (top) → #a6ccde → #b6d4a8 → #a6ca98 (bottom)
```

**Hiện trạng:** Đạt — sky muted, sun là soft glow (không disc cứng), shadow nhẹ.

---

## RULE XIV — BA TẦNG THIÊN–ĐỊA–NHÂN ✅

**Yêu cầu — 3 tầng phải luôn hiện diện:**

| Tầng | Yếu tố | Team |
|------|--------|------|
| **THIÊN** (Trời) | Mây, gió, mưa | Marketing, Thiên Thời |
| **ĐỊA** (Đất) | Đất, đá, đường rễ | Thị Trường, HR |
| **NHÂN** (Người) | Rễ, thân, cành, lá, tán | Nhân Sự, Công Nghệ, Piano, Hành Chính, Hợp Tác |

**Hiện trạng:** Đạt — cả 3 tầng đều có đại diện visual và clickable.

---

## PHỤ LỤC A — ZONE MAP

| Zone ID | Visual | Team ID | Click → |
|---------|--------|---------|---------|
| `tech` | Thân cây + tán trung tâm | `tech` | Danh sách dự án |
| `hr` | Rễ amber | `hr` | Panel Nhân Sự |
| `mkt` | Mây trái | `mkt` | Panel Marketing |
| `heaven` | Mây phải | *(null)* | Panel Thiên Thời |
| `partnerships` | Cỏ | `partnerships` | Danh sách đối tác |
| `market` | Đất dưới | *(null)* | Panel Thị Trường |
| `assistant` | Tán phải | `assistant` | Panel Hành Chính |
| `piano` | Tán trái | `piano` | Panel Piano |

---

## PHỤ LỤC B — CÁC HẰNG SỐ QUAN TRỌNG

```ts
const VW=1000, VH=700, GY=560;   // viewBox, ground Y
const TX=500;                      // trunk center X
const TRUNK_TOP_Y=258;             // trunk/branch fork Y

// Canopy anchors (asymmetric)
const PIANO_CX=215, PIANO_CY=182;  // tán trái
const ASST_CX=762,  ASST_CY=208;   // tán phải
const TECH_CX=498,  TECH_CY=112;   // tán trung tâm
const ML_CX=308, ML_CY=338;        // tán phụ trái
const MR_CX=674, MR_CY=352;        // tán phụ phải

// Branch forks (asymmetric by design)
const LBX=489, LBY=290;   // trái
const RBX=513, RBY=278;   // phải
```

---

## PHỤ LỤC C — BACKLOG ƯU TIÊN

### 🔴 Cao (chưa làm, impact lớn)
1. **Rule XI** — Weighted health score + desaturation < 40%
2. **Rule IV** — Trunk width/height động theo `techP` + growth rings
3. **Rule V** — Branch thickness/length động theo `progress`

### 🟡 Trung bình
4. **Rule III** — Root thickness động theo `hrP`
5. **Rule IX** — 4 loại cỏ theo 4 nhóm đối tác
6. **Rule XII** — Leaf grow animation khi task complete

### 🟢 Thấp (polish)
7. **Rule X** — Tree brightness khi mưa
8. **Rule VIII** — Wind effect → leaf sway (thay vì horizontal lines)
9. **Rule XII** — Branch lengthen animation khi progress tăng
