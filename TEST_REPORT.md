# 📋 BÁO CÁO DỰ ÁN & HƯỚNG DẪN KIỂM THỬ
## Tiến Độ Nhóm — Team Progress Tracker

> **URL Production:** https://team-progress-tracker-eight.vercel.app  
> **Tech Stack:** Next.js 16 · TypeScript · Tailwind CSS · Supabase  
> **Phiên bản:** Q1 2026  

---

## 1. TỔNG QUAN DỰ ÁN

Ứng dụng quản lý nội bộ giúp theo dõi tiến độ công việc, OKR và sức khỏe hoạt động của 5 phòng ban trong công ty. Dữ liệu được lưu trực tiếp lên **Supabase** (PostgreSQL cloud), đồng bộ real-time giữa các thiết bị.

### Các phòng ban trong hệ thống
| ID | Tên | Màu |
|---|---|---|
| `tech` | Công nghệ | Tím indigo |
| `mkt` | Marketing | Hồng |
| `hr` | Nhân sự | Vàng amber |
| `partnerships` | Hợp tác | Xanh emerald |
| `assistant` | Hành chính | Xanh blue |

---

## 2. SƠ ĐỒ ĐIỀU HƯỚNG

```
/ (Dashboard - Tổng quan)
├── /teams      (Phòng ban - Ecosystem Tree hoặc Cards)
│   └── /teams/:id  (Chi tiết phòng ban)
│       ├── Tab: Công việc  (Bảng task + CRUD)
│       ├── Tab: Kanban     (Cột Todo / Doing / Done)
│       ├── Tab: Gantt      (Timeline theo thời gian)
│       └── Tab: Nhật ký    (Activity log)
├── /okr        (Mục tiêu & Kết quả then chốt)
└── /settings   (Cài đặt - placeholder)
```

---

## 3. CHI TIẾT CHỨC NĂNG TỪNG TRANG

---

### 📊 TRANG 1 — Dashboard (`/`)

**Mục đích:** Nhìn tổng thể toàn bộ công ty trong một màn hình.

#### 3.1 Row Stat Cards (6 ô tóm tắt)
| Ô | Dữ liệu hiển thị | Logic tính |
|---|---|---|
| Tiến độ tổng | % hoàn thành | Tổng weight done / tổng weight tất cả tasks |
| Công việc xong | X/Y | Số task `done=true` / tổng |
| OKR trung bình | % | Trung bình tiến độ tất cả Key Results |
| Team nguy hiểm | Số đội | Tiến độ thực tế < 50% so với kỳ vọng |
| Quá hạn | Số task | Task chưa xong và `deadline < hôm nay` |
| Thời gian Q1 | % + ngày còn | Ngày đã qua / 89 ngày Q1 |

#### 3.2 KPI Chiến lược Năm 2026
4 chỉ số công ty cố định, thanh progress + đường dọc "thời gian đã trôi qua" + dự báo cuối năm:
- Dự án triển khai: 8/30
- Thành viên nền tảng: 12.4K/100K
- Đối tác ký kết: 41/136
- Doanh thu năm: 1.4T/10T

#### 3.3 Bảng tiến độ phòng ban
- Danh sách 5 phòng ban với thanh progress màu + badge sức khỏe
- Đường dọc trên thanh = kỳ vọng hôm nay
- Cột "Dự báo cuối Q1" = tính theo vận tốc hiện tại
- **Click vào dòng** → mở trang chi tiết phòng ban

#### 3.4 Cảnh báo Chiến lược
- Chỉ hiện các team Hơi Chậm 🟡 hoặc Nguy Hiểm 🔴
- Hiển thị: tên, %, chậm bao nhiêu % so với kỳ vọng

#### 3.5 Phân tích nhanh
- **Bottleneck:** Người đang ôm nhiều task nhất
- **OKR insight:** Đánh giá tổng thể OKR toàn công ty
- **Quá hạn:** Cảnh báo hoặc tick xanh nếu không có

---

### 🌳 TRANG 2 — Phòng ban (`/teams`)

#### 3.6 Toggle View
- **🌳 Growth Tree** (mặc định): SVG animation cây hệ sinh thái
- **☰ Cards**: Lưới card 3 cột

#### 3.7 Ecosystem Growth Tree (SVG)
Cây phân nhánh, mỗi nhánh = 1 phòng ban:

| Tiến độ | Giai đoạn | Hình thái |
|---|---|---|
| 0–20% | 🪵 Khô | Chỉ nhánh trơn |
| 20–50% | 🌱 Đang mọc | Lá nhỏ xuất hiện |
| 50–80% | 🌿 Xum xuê | Lá dày + sub-twigs |
| 80–99% | 🌸 Ra hoa | Blossoms hoa 5 cánh |
| 100% | 🎉 Đơm quả | Quả tròn đỏ/vàng |

**Tương tác:**
- **Hover** vào nhánh → highlight + aura glow
- **Click** vào nhánh → mở side panel bên phải (tasks + activity)
- Click **"→ Chi tiết"** trong panel → mở trang detail
- Nút **🌙 / ☀️** → toggle Dark/Light mode
- Hit area ẩn rộng 48px dọc theo nhánh để dễ click

**Nền cảnh (atmospheric):**
- Đồi xa mờ, địa hình nền đất, đám mây trôi
- Chim bay (2 con), bụi cỏ (7 khóm)
- Ô đất trống (2 "Cổ phần trống" + 2 "Vị trí mới")
- Hạt giống upcoming projects: 🚀 Q2 Launch, 🌱 New Market, ⚡ AI Feature, 🤝 Partnership

---

### 📁 TRANG 3 — Chi tiết Phòng ban (`/teams/:id`)

URL ví dụ: `/teams/tech`, `/teams/mkt`, `/teams/hr`, `/teams/partnerships`, `/teams/assistant`

#### 3.8 Header Card
- Tên phòng ban + tổng số task / đã hoàn thành
- Thanh progress lớn + %
- Cảnh báo vàng nếu tổng weight ≠ 100

#### 3.9 Tab: Công việc
**Toolbar:**
- Filter pills: Tất cả / Chờ làm / Đang làm / Hoàn thành (kèm số đếm)
- Ô tìm kiếm real-time theo tên task
- Nút **"+ Thêm công việc"**

**Bảng task (Desktop):** Checkbox | Tiêu đề | Trọng số | Phụ trách | Hạn chót | Trạng thái | Hành động

**Card list (Mobile):** Compact UI cho màn hình nhỏ

**Mỗi dòng task:**
- ✅ **Tick checkbox** → toggle done/undone → lưu DB + thêm activity log
- ✏️ **Sửa inline** → form nhỏ hiện tại chỗ, chỉnh: tiêu đề, mô tả, người phụ trách, ngày bắt đầu, hạn chót, trọng số, trạng thái
- 🗑️ **Xóa** → nhấn lần 1 = confirm, lần 2 = xóa hẳn (2-step delete)
- Task quá hạn hiển thị màu đỏ + ⚠

**Modal Thêm công việc:**
- Fields: Tiêu đề*, Mô tả, Người phụ trách*, Ngày bắt đầu, Hạn chót*, Trọng số (default 10), Trạng thái

#### 3.10 Tab: Kanban
3 cột: **Chờ làm** | **Đang làm** | **Hoàn thành**
- Mỗi card hiện: tên, badge trạng thái, trọng số (w:X), deadline
- Task quá hạn hiện viền đỏ
- Drag-drop visual columns (responsive)

#### 3.11 Tab: Gantt
Timeline ngang theo ngày:
- Cột trái: tên task + badge
- Thanh ngang: từ `startDate` đến `deadline`
- Màu theo trạng thái (Todo=xám, Doing=màu team, Done=xanh)
- Đường dọc đỏ = hôm nay
- Markers tuần (mỗi 7 ngày)
- Phần trên: mini-bar tổng tiến độ team

#### 3.12 Tab: Nhật ký (Activity Log)
- List sự kiện theo thứ tự ngược thời gian
- Ghi lại: tick task, chuyển trạng thái, thêm/sửa/xóa task
- 🤖 Tự động ghi khi task tự chuyển Todo → Doing (nếu đến ngày bắt đầu)
- Tối đa 200 entries / phòng ban

---

### 🎯 TRANG 4 — OKR (`/okr`)

#### 3.13 Summary Stats
| Metric | |
|---|---|
| Tổng mục tiêu | Số Objective |
| Hoàn thành | Objective đạt 100% |
| Kết quả then chốt | Tổng KR |
| Tiến độ TB | % trung bình tất cả KR |

#### 3.14 Danh sách OKR theo phòng ban
Group theo: Toàn công ty → Công nghệ → Nhân sự → Hợp tác → Hành chính

**Mỗi Objective card:**
- Progress ring SVG (màu theo phòng ban)
- Badge quý (Q1 2026…)
- Số KR + tiêu đề
- Accordion mở/đóng click header
- ✏️ Sửa tiêu đề + quý inline
- 🗑️ Xóa objective (2-step confirm)

**Mỗi Key Result row:**
- Progress bar màu (đỏ < 40%, vàng < 70%, tím ≥ 70%, xanh = 100%)
- `current / target unit` dạng button bấm được
- **Click số** → nhập giá trị hiện tại mới → Enter hoặc Lưu
- ✏️ Sửa tất cả fields (title, current, target, unit)
- 🗑️ Xóa KR (2-step confirm)
- Nút **"+ Thêm kết quả then chốt"** ở cuối mỗi objective

**Thêm Objective:**
- Nút **"+ Thêm mục tiêu"** trên góc phải
- Modal: tiêu đề, phòng ban (dropdown), quý

---

## 4. HỆ THỐNG DỮ LIỆU

### 4.1 Database (Supabase PostgreSQL)
| Bảng | Mô tả |
|---|---|
| `teams` | 5 phòng ban (id, name, color) |
| `tasks` | Công việc (id, team_id, title, description, weight, owner, deadline, start_date, status, done) |
| `objectives` | Mục tiêu OKR (id, team_id, quarter, title) |
| `key_results` | Kết quả then chốt (id, objective_id, title, current, target, unit) |
| `activity` | Log hoạt động (id, team_id, message, timestamp) |

### 4.2 Seed data mặc định
- 5 teams, 26 tasks (đã có dữ liệu thực tế), 6 objectives, 17 key results

### 4.3 Optimistic Update
- UI cập nhật **ngay lập tức** (không chờ DB), DB write chạy bất đồng bộ sau
- Nếu Supabase unavailable → fallback về seed data, không crash app

### 4.4 Auto-transition
- Khi mở app, mọi task có `status = "Todo"` và `startDate ≤ hôm nay` tự chuyển sang `"Doing"` + ghi activity log

---

## 5. HƯỚNG DẪN TEST — TEST CASES

### 🧪 TC-01: Dashboard hiển thị đúng số liệu
| Bước | Kết quả mong đợi |
|---|---|
| Mở `/` | Loading spinner → hiện dashboard |
| Xem 6 stat cards | Số đếm khớp với thực tế tasks |
| Xem "Thời gian Q1" | Đúng ngày hôm nay so với Q1 |
| Xem KPI | 4 thanh progress hiện đúng số |
| Xem cảnh báo | Đúng team nào đang chậm |
| Click 1 dòng team | Redirect sang `/teams/:id` |

### 🧪 TC-02: Toggle view Phòng ban
| Bước | Kết quả mong đợi |
|---|---|
| Mở `/teams` | Mặc định hiện Growth Tree |
| Click **☰ Cards** | Chuyển sang lưới card |
| Click **🌳 Growth Tree** | Quay về cây |

### 🧪 TC-03: Tương tác Ecosystem Tree
| Bước | Kết quả mong đợi |
|---|---|
| Hover vào nhánh | Nhánh sáng lên + aura |
| Click vào nhánh | Panel bên phải hiện ra |
| Click nhánh đang chọn | Panel đóng lại |
| Click **→ Chi tiết** trong panel | Mở `/teams/:id` |
| Click 🌙 | Cây chuyển dark mode |
| Click ☀️ | Quay lại light mode |

### 🧪 TC-04: Thêm công việc
| Bước | Kết quả mong đợi |
|---|---|
| Mở `/teams/tech` |  |
| Click **+ Thêm công việc** | Modal hiện ra |
| Bỏ trống Tiêu đề → Click Lưu | Button bị disabled |
| Điền đủ thông tin → Lưu | Task mới xuất hiện ngay trong bảng |
| F5 | Task vẫn còn (đã lưu DB) |

### 🧪 TC-05: Tick/untick task
| Bước | Kết quả mong đợi |
|---|---|
| Tick checkbox bất kỳ task | Dòng mờ đi, gạch ngang tên, tiến độ % tăng |
| Nhìn Activity log | Xuất hiện entry mới "đã đánh dấu Hoàn thành" |
| F5 | Trạng thái vẫn giữ nguyên |
| Untick | Tiến độ giảm lại |

### 🧪 TC-06: Sửa task inline
| Bước | Kết quả mong đợi |
|---|---|
| Click icon ✏️ trên 1 task | Dòng chuyển thành form chỉnh sửa |
| Sửa tên → Lưu | Tên cập nhật ngay |
| Click Hủy | Form biến mất, không thay đổi |

### 🧪 TC-07: Xóa task (2-step)
| Bước | Kết quả mong đợi |
|---|---|
| Click icon 🗑️ | Button "Xóa" đỏ + "✕" hiện ra |
| Click ✕ | Hủy, không xóa |
| Click 🗑️ → Click **Xóa** | Task biến khỏi danh sách |
| F5 | Task không còn nữa |

### 🧪 TC-08: Filter + Search
| Bước | Kết quả mong đợi |
|---|---|
| Click pill **Đang làm** | Chỉ hiện task có status Doing |
| Gõ vào ô tìm kiếm | Lọc real-time theo keyword |
| Xóa text search | Hiện lại tất cả |

### 🧪 TC-09: Kanban board
| Bước | Kết quả mong đợi |
|---|---|
| Mở tab **Kanban** | 3 cột Todo/Doing/Done |
| Đối chiếu số card với tab Công việc | Khớp nhau |
| Task quá hạn | Hiện viền/màu đỏ |

### 🧪 TC-10: Gantt chart
| Bước | Kết quả mong đợi |
|---|---|
| Mở tab **Gantt** | Timeline ngang, có đường đỏ hôm nay |
| Task không có startDate | Thanh bắt đầu từ ngày tạo hoặc không hiện |
| Task đã Done | Thanh màu xanh |
| Task Doing | Thanh màu theo team |

### 🧪 TC-11: OKR — Cập nhật Key Result
| Bước | Kết quả mong đợi |
|---|---|
| Mở `/okr` | Loading → hiện tất cả OKR |
| Click vào con số `current / target unit` | Ô nhập số hiện ra |
| Nhập số mới → Enter | Progress bar cập nhật ngay |
| F5 | Số mới vẫn còn |

### 🧪 TC-12: OKR — Thêm Objective + KR mới
| Bước | Kết quả mong đợi |
|---|---|
| Click **+ Thêm mục tiêu** | Modal hiện |
| Chọn phòng ban, nhập tiêu đề, quý → Tạo | Objective mới hiện trong đúng section |
| Click **+ Thêm kết quả then chốt** | Form nhỏ mở bên dưới |
| Điền title, target, unit → Thêm KR | KR row hiện ra |

### 🧪 TC-13: OKR — Xóa Objective
| Bước | Kết quả mong đợi |
|---|---|
| Hover vào objective → Click 🗑️ | Confirm buttons hiện |
| Confirm **Xóa** | Xóa cả objective lẫn toàn bộ KR con |

### 🧪 TC-14: Kiểm tra Activity Log
| Bước | Kết quả mong đợi |
|---|---|
| Thêm 1 task | Vào Activity log thấy entry mới |
| Tick task | Thấy entry "đã đánh dấu Hoàn thành" |
| Sửa trạng thái task | Thấy entry "chuyển sang [trạng thái]" |

### 🧪 TC-15: Responsive Mobile
| Bước | Kết quả mong đợi |
|---|---|
| Mở trên mobile (≤ 768px) | Sidebar ẩn, menu hamburger phía trên |
| Trang Task | Hiện dạng card thay vì table |
| Dashboard | Cards stack 2 cột |

### 🧪 TC-16: Loading State
| Bước | Kết quả mong đợi |
|---|---|
| Mở bất kỳ trang | Spinner hiện tối đa vài giây |
| Sau khi load | Spinner biến mất, dữ liệu hiện |
| Không có internet | Fallback về seed data, không crash |

---

## 6. CÁC LỆ NGOẠI (EDGE CASES) CẦN CHÚ Ý

| Trường hợp | Hành vi |
|---|---|
| Tổng weight task ≠ 100 | Banner cảnh báo vàng trên trang team detail |
| Không có task nào | Hiện "Không có công việc nào" |
| KR có target = 0 | Tính = 100% (tránh chia 0) |
| KR unit = "ms" hoặc "%" mà current > target | Nghịch chiều (thấp hơn = tốt hơn) |
| Q1_ELAPSED = 0 | Kỳ vọng = 0, không chia 0 |
| Task startDate > hôm nay | Không auto-transition |

---

## 7. THÔNG TIN KỸ THUẬT

| Mục | Chi tiết |
|---|---|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel (region: Portland US-West) |
| Auth | Không có (internal tool) |
| State | React Context + useState (no Redux) |
| Data sync | Supabase JS client, optimistic update |

### Biến môi trường cần thiết (đã set trên Vercel):
```
NEXT_PUBLIC_SUPABASE_URL=https://sdcfgcchvxevgpozachn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 8. CHECKLIST TRƯỚC KHI RELEASE

- [x] Build production thành công (`npm run build`)
- [x] Tất cả trang load không có lỗi console
- [x] CRUD tasks hoạt động + đồng bộ DB
- [x] CRUD objectives + KR hoạt động
- [x] Activity log ghi đúng
- [x] Ecosystem Tree render + tương tác được
- [x] Responsive mobile
- [x] Loading states trên tất cả trang
- [x] Không có React hooks order error (#310)
- [x] Supabase env vars đặt đúng trên Vercel
- [x] Fallback seed data nếu DB lỗi

---

## 9. BUGS ĐÃ FIX

| Bug | Nguyên nhân | Fix |
|---|---|---|
| Màn hình trắng sau tick task + F5 | `useMemo` đặt sau `if (loading) return` → React error #310 | Chuyển useMemo lên trước early return |
| Client-side crash khi load | `useMemo` trong `okr/page.tsx` sau early return | Tương tự, chuyển useState trước loading |
| `this` context mất trong Supabase | Proxy export không bind method | Thêm `.bind(client)` cho function properties |
| TODAY hardcode 2026-02-24 | Giá trị tĩnh | Đổi thành `new Date()` |
| Token GitHub lộ trong .git/config | Paste URL có token | `git remote set-url` xóa token |

---

*Tài liệu tạo ngày: 24/02/2026*
