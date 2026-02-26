import { Team, Task, Objective } from "./types";

const today = new Date();
function daysFromNow(days: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
function daysAgo(days: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export const TEAMS: Team[] = [
  { id: "tech", name: "Công nghệ", color: "#6366f1" },
  { id: "mkt", name: "Marketing", color: "#ec4899" },
  { id: "hr", name: "Nhân sự", color: "#f59e0b" },
  { id: "partnerships", name: "Hợp tác", color: "#10b981" },
  { id: "assistant", name: "Hành chính", color: "#3b82f6" },
  { id: "piano", name: "Piano", color: "#8b5cf6" },
];

export const SEED_TASKS: Task[] = [
  { id: "t1", teamId: "tech", title: "Chuyen doi co so du lieu sang PostgreSQL", description: "Di chuyen toan bo bang MySQL cu sang PostgreSQL va chay kiem thu hoi quy.", weight: 20, owner: "Truong ky thuat", startDate: daysAgo(14), deadline: daysFromNow(7), status: "Done", done: true },
  { id: "t2", teamId: "tech", title: "Trien khai quy trinh CI/CD", description: "Thiet lap GitHub Actions cho quy trinh build, test va deploy.", weight: 15, owner: "Ky su DevOps", startDate: daysAgo(10), deadline: daysFromNow(10), status: "Done", done: true },
  { id: "t3", teamId: "tech", title: "Gioi han toc do & Cache API", description: "Them gioi han toc do Redis va cache phan hoi cho cac API cot loi.", weight: 15, owner: "Lap trinh Backend", startDate: daysAgo(3), deadline: daysFromNow(14), status: "Doing", done: false },
  { id: "t4", teamId: "tech", title: "Thiet ke lai giao dien responsive", description: "Refactor cac component UI dat chuan WCAG AA va cac breakpoint di dong.", weight: 20, owner: "Lap trinh Frontend", startDate: daysFromNow(2), deadline: daysFromNow(20), status: "Doing", done: false },
  { id: "t5", teamId: "tech", title: "Kiem thu bao mat (Pen-test)", description: "Thue don vi ben ngoai pen-test va khac phuc cac lo hong nghiem trong.", weight: 15, owner: "Truong ky thuat", startDate: daysFromNow(8), deadline: daysFromNow(25), status: "Todo", done: false },
  { id: "t6", teamId: "tech", title: "Xay dung wiki noi bo", description: "Tao khong gian Confluence voi so do kien truc va huong dan van hanh.", weight: 15, owner: "Truong ky thuat", startDate: daysFromNow(15), deadline: daysFromNow(30), status: "Todo", done: false },

  { id: "m1", teamId: "mkt", title: "Deck chien luoc chien dich Q1", description: "Chuan bi slide trinh bay muc tieu va KPI chien dich Q1.", weight: 15, owner: "Marketer", startDate: daysAgo(7), deadline: daysFromNow(3), status: "Done", done: true },
  { id: "m2", teamId: "mkt", title: "Lich noi dung mang xa hoi", description: "Lap lich dang bai 30 ngay cho LinkedIn, X va Instagram.", weight: 10, owner: "Quan ly Noi dung", startDate: daysAgo(5), deadline: daysFromNow(5), status: "Done", done: true },
  { id: "m3", teamId: "mkt", title: "Trien khai chien dich email nho giot", description: "Viet va len lich chuoi 5 email duong khach cho nguoi dung moi.", weight: 20, owner: "Marketer", startDate: daysAgo(1), deadline: daysFromNow(12), status: "Doing", done: false },
  { id: "m4", teamId: "mkt", title: "Kiem tra SEO & cap nhat tu khoa", description: "Quet toan site, cap nhat meta tag va nham muc tieu tu khoa moi.", weight: 15, owner: "Chuyen vien SEO", startDate: daysFromNow(5), deadline: daysFromNow(18), status: "Todo", done: false },
  { id: "m5", teamId: "mkt", title: "Kiem thu A/B quang cao tra phi", description: "Tao hai bien the quang cao Google/Meta va chay split test 2 tuan.", weight: 20, owner: "Quang cao tra phi", startDate: daysFromNow(10), deadline: daysFromNow(22), status: "Todo", done: false },
  { id: "m6", teamId: "mkt", title: "Tom tat hop tac KOL/Influencer", description: "Tim 10 micro-influencer va soan thao brief hop tac.", weight: 20, owner: "Marketer", startDate: daysFromNow(16), deadline: daysFromNow(28), status: "Todo", done: false },

  { id: "h1", teamId: "hr", title: "Cap nhat so tay nhan vien", description: "Sua doi chinh sach lam viec tu xa va bo sung dieu khoan nghi thai san.", weight: 20, owner: "Truong nhan su", startDate: daysAgo(10), deadline: daysFromNow(6), status: "Done", done: true },
  { id: "h2", teamId: "hr", title: "Onboard 3 ky su moi", description: "Chuan bi may tinh, tai khoan va lo trinh onboarding 30 ngay.", weight: 15, owner: "Truong nhan su", startDate: daysAgo(5), deadline: daysFromNow(9), status: "Done", done: true },
  { id: "h3", teamId: "hr", title: "Chu ky danh gia hieu suat Q1", description: "Gui bieu mau tu danh gia, thu thap phan hoi quan ly, len lich 1:1.", weight: 25, owner: "Truong nhan su", startDate: daysAgo(2), deadline: daysFromNow(15), status: "Doing", done: false },
  { id: "h4", teamId: "hr", title: "Dao tao Da dang & Hoa nhap (D&I)", description: "Len lich va theo doi hoan thanh Workshop D&I toan cong ty.", weight: 15, owner: "Chuyen vien L&D", startDate: daysFromNow(7), deadline: daysFromNow(20), status: "Todo", done: false },
  { id: "h5", teamId: "hr", title: "Nang cap cong phuc loi", description: "Phoi hop voi nha cung cap cap nhat danh sach bao hiem suc khoe va nha khoa.", weight: 25, owner: "Truong nhan su", startDate: daysFromNow(14), deadline: daysFromNow(29), status: "Todo", done: false },

  { id: "p1", teamId: "partnerships", title: "Ky MOU voi Doi tac A", description: "Hoan thien va ky ket bien ban ghi nho voi Doi tac A.", weight: 20, owner: "Truong BD", startDate: daysAgo(8), deadline: daysFromNow(4), status: "Done", done: true },
  { id: "p2", teamId: "partnerships", title: "Ban tin doi tac hang quy", description: "Soan thao va gui ban tin cap nhat Q1 toi tat ca doi tac hien huu.", weight: 10, owner: "BD", startDate: daysAgo(4), deadline: daysFromNow(8), status: "Done", done: true },
  { id: "p3", teamId: "partnerships", title: "Tich hop API voi Doi tac B", description: "Xay dung tich hop OAuth2 voi luong du lieu API cua Doi tac B.", weight: 25, owner: "BD", startDate: daysAgo(1), deadline: daysFromNow(16), status: "Doing", done: false },
  { id: "p4", teamId: "partnerships", title: "Hoi thao chung - Doi tac C", description: "Dong to chuc webinar 60 phut gioi thieu san pham cung Doi tac C.", weight: 20, owner: "Truong BD", startDate: daysFromNow(8), deadline: daysFromNow(21), status: "Todo", done: false },
  { id: "p5", teamId: "partnerships", title: "Gia han hop dong thuong nien (3 doi tac)", description: "Xem xet dieu khoan, dam phan gia va hoan tat gia han truoc thoi han.", weight: 25, owner: "Truong BD", startDate: daysFromNow(14), deadline: daysFromNow(27), status: "Todo", done: false },

  { id: "a1", teamId: "assistant", title: "Dat dia diem offsite lanh dao Q2", description: "Tim kiem dia diem, dam phan gia va xac nhan ngay cho 20 nguoi.", weight: 15, owner: "Van hanh", startDate: daysAgo(6), deadline: daysFromNow(5), status: "Done", done: true },
  { id: "a2", teamId: "assistant", title: "Dat mua van phong pham", description: "Bo sung muc in, van phong pham va kho ca phe.", weight: 10, owner: "Van hanh", startDate: daysAgo(4), deadline: daysFromNow(7), status: "Done", done: true },
  { id: "a3", teamId: "assistant", title: "To chuc hau can hop hoi dong quan tri", description: "Dat phong hop, chuan bi tai lieu, sap xep an uong cho 10 nguoi.", weight: 20, owner: "Van hanh", startDate: daysAgo(1), deadline: daysFromNow(11), status: "Doing", done: false },
  { id: "a4", teamId: "assistant", title: "Cap nhat bang theo doi hop dong nha cung cap", description: "Ghi lai tat ca hop dong nha cung cap hien hanh kem ngay het han vao sheet chung.", weight: 15, owner: "Van hanh", startDate: daysFromNow(3), deadline: daysFromNow(16), status: "Doing", done: false },
  { id: "a5", teamId: "assistant", title: "Dat ve - chuyen cong tac thang 3 cua ban lanh dao", description: "Dat ve may bay va khach san cho 4 lanh dao tham du hoi nghi nganh.", weight: 20, owner: "Van hanh", startDate: daysFromNow(10), deadline: daysFromNow(23), status: "Todo", done: false },
  { id: "a6", teamId: "assistant", title: "Chuan bi town hall toan cong ty", description: "Soan thao chuong trinh nghi su, dieu phoi dien gia va gui lich toi toan the nhan vien.", weight: 20, owner: "Van hanh", startDate: daysFromNow(18), deadline: daysFromNow(30), status: "Todo", done: false },
];

export const SEED_OBJECTIVES: Objective[] = [
  // ── Cong ty ──────────────────────────────────────────────────
  {
    id: "obj-c1",
    teamId: "company",
    quarter: "Q1 2026",
    title: "Xây dựng nền tảng kỹ thuật vững chắc",
    keyResults: [
      { id: "kr-c1-1", title: "Dạt 99.9% uptime toàn bộ hệ thống", current: 99.7, target: 99.9, unit: "%" },
      { id: "kr-c1-2", title: "Giảm thời gian phản hồi API xuống dưới 200ms", current: 240, target: 200, unit: "ms" },
      { id: "kr-c1-3", title: "Phủ sóng 80% code bằng unit test", current: 62, target: 80, unit: "%" },
    ],
  },
  {
    id: "obj-c2",
    teamId: "company",
    quarter: "Q1 2026",
    title: "Tăng trưởng doanh thu 30% trong Q1",
    keyResults: [
      { id: "kr-c2-1", title: "Dạt 500 khách hàng trả phí mới", current: 320, target: 500, unit: "khách" },
      { id: "kr-c2-2", title: "Tăng ARR lên 2 tỷ VND", current: 1.4, target: 2, unit: "tỷ VND" },
      { id: "kr-c2-3", title: "Giảm tỷ lệ rời bỏ khách hàng xuống 5%", current: 8, target: 5, unit: "%" },
    ],
  },

  // ── Cong nghe ─────────────────────────────────────────────────
  {
    id: "obj-tech1",
    teamId: "tech",
    quarter: "Q1 2026",
    title: "Nâng cấp cơ sở hạ tầng hệ thống",
    keyResults: [
      { id: "kr-tech1-1", title: "Hoàn thành chuyển đổi PostgreSQL", current: 100, target: 100, unit: "%" },
      { id: "kr-tech1-2", title: "Triển khai CI/CD cho 3 microservice", current: 2, target: 3, unit: "service" },
      { id: "kr-tech1-3", title: "Giảm thời gian deploy xuống dưới 5 phút", current: 12, target: 5, unit: "phút" },
    ],
  },
  {
    id: "obj-tech2",
    teamId: "tech",
    quarter: "Q1 2026",
    title: "Cải thiện bảo mật sản phẩm",
    keyResults: [
      { id: "kr-tech2-1", title: "Khắc phục 100% lỗ hổng nghiêm trọng từ pen-test", current: 0, target: 100, unit: "%" },
      { id: "kr-tech2-2", title: "Áp dụng 2FA cho toàn bộ tài khoản quản trị", current: 60, target: 100, unit: "%" },
    ],
  },

  // ── Marketing ─────────────────────────────────────────────────
  {
    id: "obj-mkt1",
    teamId: "mkt",
    quarter: "Q1 2026",
    title: "Tăng nhận diện thương hiệu",
    keyResults: [
      { id: "kr-mkt1-1", title: "Dạt 10.000 follower mới trên LinkedIn", current: 6500, target: 10000, unit: "follower" },
      { id: "kr-mkt1-2", title: "Tăng traffic từ SEO lên 40%", current: 22, target: 40, unit: "%" },
      { id: "kr-mkt1-3", title: "Dạt 50.000 impression quảng cáo trả phí", current: 31000, target: 50000, unit: "impression" },
    ],
  },
  {
    id: "obj-mkt2",
    teamId: "mkt",
    quarter: "Q1 2026",
    title: "Tối ưu hóa chuyển đổi lead",
    keyResults: [
      { id: "kr-mkt2-1", title: "Tăng tỷ lệ mở email lên 25%", current: 18, target: 25, unit: "%" },
      { id: "kr-mkt2-2", title: "Tạo 200 MQL mới từ chiến dịch", current: 127, target: 200, unit: "MQL" },
    ],
  },

  // ── Nhan su ────────────────────────────────────────────────────
  {
    id: "obj-hr1",
    teamId: "hr",
    quarter: "Q1 2026",
    title: "Xây dựng văn hóa công ty tích cực",
    keyResults: [
      { id: "kr-hr1-1", title: "Dạt điểm eNPS ≥ 40", current: 32, target: 40, unit: "điểm" },
      { id: "kr-hr1-2", title: "100% nhân viên tham gia đào tạo D&I", current: 0, target: 100, unit: "%" },
      { id: "kr-hr1-3", title: "Giảm tỷ lệ nghỉ việc xuống 8%", current: 11, target: 8, unit: "%" },
    ],
  },
  {
    id: "obj-hr2",
    teamId: "hr",
    quarter: "Q1 2026",
    title: "Hoàn thiện hệ thống quản lý hiệu suất",
    keyResults: [
      { id: "kr-hr2-1", title: "100% nhân viên hoàn thành tự đánh giá Q1", current: 65, target: 100, unit: "%" },
      { id: "kr-hr2-2", title: "Triển khai OKR cho 5 phòng ban", current: 3, target: 5, unit: "phòng ban" },
    ],
  },

  // ── Hop tac ────────────────────────────────────────────────────
  {
    id: "obj-p1",
    teamId: "partnerships",
    quarter: "Q1 2026",
    title: "Mở rộng mạng lưới đối tác chiến lược",
    keyResults: [
      { id: "kr-p1-1", title: "Ký kết 5 MOU mới với đối tác tiềm năng", current: 3, target: 5, unit: "MOU" },
      { id: "kr-p1-2", title: "Tăng doanh thu từ kênh đối tác lên 20%", current: 12, target: 20, unit: "%" },
      { id: "kr-p1-3", title: "Tổ chức 3 sự kiện co-marketing", current: 1, target: 3, unit: "sự kiện" },
    ],
  },

  // ── Hanh chinh ─────────────────────────────────────────────────
  {
    id: "obj-a1",
    teamId: "assistant",
    quarter: "Q1 2026",
    title: "Nâng cao hiệu quả vận hành nội bộ",
    keyResults: [
      { id: "kr-a1-1", title: "Giảm chi phí vận hành xuống 15%", current: 8, target: 15, unit: "%" },
      { id: "kr-a1-2", title: "Số hóa 100% tài liệu hợp đồng", current: 70, target: 100, unit: "%" },
      { id: "kr-a1-3", title: "Dạt điểm hài lòng nội bộ ≥ 4.5/5", current: 4.1, target: 4.5, unit: "/5" },
    ],
  },
];
