-- ============================================================
--  Team Progress Tracker – Supabase Schema
--  Paste this in the Supabase SQL Editor and click "Run"
-- ============================================================

-- ── Tables ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.teams (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id          TEXT PRIMARY KEY,
  team_id     TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  weight      INTEGER NOT NULL DEFAULT 10,
  owner       TEXT NOT NULL DEFAULT '',
  deadline    TEXT NOT NULL,
  start_date  TEXT,
  status      TEXT NOT NULL DEFAULT 'Todo' CHECK (status IN ('Todo','Doing','Done')),
  done        BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.objectives (
  id       TEXT PRIMARY KEY,
  team_id  TEXT NOT NULL,          -- 'company' or a teams.id
  quarter  TEXT NOT NULL,
  title    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.key_results (
  id           TEXT PRIMARY KEY,
  objective_id TEXT NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  current      NUMERIC NOT NULL DEFAULT 0,
  target       NUMERIC NOT NULL DEFAULT 100,
  unit         TEXT NOT NULL DEFAULT '%'
);

CREATE TABLE IF NOT EXISTS public.activity (
  id        TEXT PRIMARY KEY,
  team_id   TEXT NOT NULL,
  message   TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

-- ── Row Level Security (open for now – tighten once auth is added) ──

ALTER TABLE public.teams       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_teams"       ON public.teams       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tasks"       ON public.tasks       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_objectives"  ON public.objectives  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_key_results" ON public.key_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_activity"    ON public.activity    FOR ALL USING (true) WITH CHECK (true);

-- ── Indexes ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tasks_team       ON public.tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_objectives_team  ON public.objectives(team_id);
CREATE INDEX IF NOT EXISTS idx_key_results_obj  ON public.key_results(objective_id);
CREATE INDEX IF NOT EXISTS idx_activity_team    ON public.activity(team_id);

-- ============================================================
--  Seed data  (run once; safe to re-run – uses ON CONFLICT DO NOTHING)
-- ============================================================

INSERT INTO public.teams (id, name, color) VALUES
  ('tech',         'Công nghệ', '#6366f1'),
  ('mkt',          'Marketing', '#ec4899'),
  ('hr',           'Nhân sự',   '#f59e0b'),
  ('partnerships', 'Hợp tác',   '#10b981'),
  ('assistant',    'Hành chính','#3b82f6')
ON CONFLICT (id) DO NOTHING;

-- Tasks (dates relative to 2026-02-24)
INSERT INTO public.tasks (id, team_id, title, description, weight, owner, start_date, deadline, status, done) VALUES
  ('t1','tech','Chuyen doi co so du lieu sang PostgreSQL','Di chuyen toan bo bang MySQL cu sang PostgreSQL va chay kiem thu hoi quy.',20,'Truong ky thuat','2026-02-10','2026-03-03','Done',true),
  ('t2','tech','Trien khai quy trinh CI/CD','Thiet lap GitHub Actions cho quy trinh build, test va deploy.',15,'Ky su DevOps','2026-02-14','2026-03-06','Done',true),
  ('t3','tech','Gioi han toc do & Cache API','Them gioi han toc do Redis va cache phan hoi cho cac API cot loi.',15,'Lap trinh Backend','2026-02-21','2026-03-10','Doing',false),
  ('t4','tech','Thiet ke lai giao dien responsive','Refactor cac component UI dat chuan WCAG AA va cac breakpoint di dong.',20,'Lap trinh Frontend','2026-02-26','2026-03-16','Doing',false),
  ('t5','tech','Kiem thu bao mat (Pen-test)','Thue don vi ben ngoai pen-test va khac phuc cac lo hong nghiem trong.',15,'Truong ky thuat','2026-03-04','2026-03-21','Todo',false),
  ('t6','tech','Xay dung wiki noi bo','Tao khong gian Confluence voi so do kien truc va huong dan van hanh.',15,'Truong ky thuat','2026-03-11','2026-03-26','Todo',false),

  ('m1','mkt','Deck chien luoc chien dich Q1','Chuan bi slide trinh bay muc tieu va KPI chien dich Q1.',15,'Marketer','2026-02-17','2026-02-27','Done',true),
  ('m2','mkt','Lich noi dung mang xa hoi','Lap lich dang bai 30 ngay cho LinkedIn, X va Instagram.',10,'Quan ly Noi dung','2026-02-19','2026-03-01','Done',true),
  ('m3','mkt','Trien khai chien dich email nho giot','Viet va len lich chuoi 5 email duong khach cho nguoi dung moi.',20,'Marketer','2026-02-23','2026-03-08','Doing',false),
  ('m4','mkt','Kiem tra SEO & cap nhat tu khoa','Quet toan site, cap nhat meta tag va nham muc tieu tu khoa moi.',15,'Chuyen vien SEO','2026-03-01','2026-03-14','Todo',false),
  ('m5','mkt','Kiem thu A/B quang cao tra phi','Tao hai bien the quang cao Google/Meta va chay split test 2 tuan.',20,'Quang cao tra phi','2026-03-06','2026-03-18','Todo',false),
  ('m6','mkt','Tom tat hop tac KOL/Influencer','Tim 10 micro-influencer va soan thao brief hop tac.',20,'Marketer','2026-03-12','2026-03-24','Todo',false),

  ('h1','hr','Cap nhat so tay nhan vien','Sua doi chinh sach lam viec tu xa va bo sung dieu khoan nghi thai san.',20,'Truong nhan su','2026-02-14','2026-03-02','Done',true),
  ('h2','hr','Onboard 3 ky su moi','Chuan bi may tinh, tai khoan va lo trinh onboarding 30 ngay.',15,'Truong nhan su','2026-02-19','2026-03-05','Done',true),
  ('h3','hr','Chu ky danh gia hieu suat Q1','Gui bieu mau tu danh gia, thu thap phan hoi quan ly, len lich 1:1.',25,'Truong nhan su','2026-02-22','2026-03-11','Doing',false),
  ('h4','hr','Dao tao Da dang & Hoa nhap (D&I)','Len lich va theo doi hoan thanh Workshop D&I toan cong ty.',15,'Chuyen vien L&D','2026-03-03','2026-03-16','Todo',false),
  ('h5','hr','Nang cap cong phuc loi','Phoi hop voi nha cung cap cap nhat danh sach bao hiem suc khoe va nha khoa.',25,'Truong nhan su','2026-03-10','2026-03-25','Todo',false),

  ('p1','partnerships','Ky MOU voi Doi tac A','Hoan thien va ky ket bien ban ghi nho voi Doi tac A.',20,'Truong BD','2026-02-16','2026-02-28','Done',true),
  ('p2','partnerships','Ban tin doi tac hang quy','Soan thao va gui ban tin cap nhat Q1 toi tat ca doi tac hien huu.',10,'BD','2026-02-20','2026-03-04','Done',true),
  ('p3','partnerships','Tich hop API voi Doi tac B','Xay dung tich hop OAuth2 voi luong du lieu API cua Doi tac B.',25,'BD','2026-02-23','2026-03-12','Doing',false),
  ('p4','partnerships','Hoi thao chung - Doi tac C','Dong to chuc webinar 60 phut gioi thieu san pham cung Doi tac C.',20,'Truong BD','2026-03-04','2026-03-17','Todo',false),
  ('p5','partnerships','Gia han hop dong thuong nien (3 doi tac)','Xem xet dieu khoan, dam phan gia va hoan tat gia han truoc thoi han.',25,'Truong BD','2026-03-10','2026-03-23','Todo',false),

  ('a1','assistant','Dat dia diem offsite lanh dao Q2','Tim kiem dia diem, dam phan gia va xac nhan ngay cho 20 nguoi.',15,'Van hanh','2026-02-18','2026-03-01','Done',true),
  ('a2','assistant','Dat mua van phong pham','Bo sung muc in, van phong pham va kho ca phe.',10,'Van hanh','2026-02-20','2026-03-03','Done',true),
  ('a3','assistant','To chuc hau can hop hoi dong quan tri','Dat phong hop, chuan bi tai lieu, sap xep an uong cho 10 nguoi.',20,'Van hanh','2026-02-23','2026-03-07','Doing',false),
  ('a4','assistant','Cap nhat bang theo doi hop dong nha cung cap','Ghi lai tat ca hop dong nha cung cap hien hanh kem ngay het han vao sheet chung.',15,'Van hanh','2026-02-27','2026-03-12','Doing',false),
  ('a5','assistant','Dat ve - chuyen cong tac thang 3 cua ban lanh dao','Dat ve may bay va khach san cho 4 lanh dao tham du hoi nghi nganh.',20,'Van hanh','2026-03-06','2026-03-19','Todo',false),
  ('a6','assistant','Chuan bi town hall toan cong ty','Soan thao chuong trinh nghi su, dieu phoi dien gia va gui lich toi toan the nhan vien.',20,'Van hanh','2026-03-14','2026-03-26','Todo',false)
ON CONFLICT (id) DO NOTHING;

-- Objectives
INSERT INTO public.objectives (id, team_id, quarter, title) VALUES
  ('obj-c1','company','Q1 2026','Xây dựng nền tảng kỹ thuật vững chắc'),
  ('obj-c2','company','Q1 2026','Tăng trưởng doanh thu 30% trong Q1'),
  ('obj-c3','company','Q1 2026','Nâng cao trải nghiệm khách hàng'),
  ('obj-t1','tech','Q1 2026','Nâng cấp hạ tầng và bảo mật hệ thống'),
  ('obj-m1','mkt','Q1 2026','Tăng nhận diện thương hiệu 40%'),
  ('obj-h1','hr','Q1 2026','Xây dựng môi trường làm việc xuất sắc')
ON CONFLICT (id) DO NOTHING;

-- Key Results
INSERT INTO public.key_results (id, objective_id, title, current, target, unit) VALUES
  ('kr-c1-1','obj-c1','Đạt 99.9% uptime toàn bộ hệ thống',99.7,99.9,'%'),
  ('kr-c1-2','obj-c1','Giảm thời gian phản hồi API xuống dưới 200ms',240,200,'ms'),
  ('kr-c1-3','obj-c1','Phủ sóng 80% code bằng unit test',62,80,'%'),
  ('kr-c2-1','obj-c2','Đạt 500 khách hàng trả phí mới',320,500,'khách'),
  ('kr-c2-2','obj-c2','Tăng ARR lên 2 tỷ VND',1.4,2,'tỷ VND'),
  ('kr-c2-3','obj-c2','Giảm tỷ lệ rời bỏ khách hàng xuống 5%',8,5,'%'),
  ('kr-c3-1','obj-c3','Đạt điểm NPS ≥ 50',42,50,'điểm'),
  ('kr-c3-2','obj-c3','Giải quyết 95% ticket trong 24 giờ',88,95,'%'),
  ('kr-t1-1','obj-t1','Hoàn thành migration PostgreSQL',100,100,'%'),
  ('kr-t1-2','obj-t1','Triển khai CI/CD cho 3 dịch vụ',3,3,'dịch vụ'),
  ('kr-t1-3','obj-t1','Vượt qua pen-test không có lỗ hổng nghiêm trọng',0,1,'lần'),
  ('kr-m1-1','obj-m1','Tăng followers tổng hợp lên 50.000',38000,50000,'followers'),
  ('kr-m1-2','obj-m1','Tỷ lệ mở email ≥ 28%',22,28,'%'),
  ('kr-m1-3','obj-m1','Giảm CPA xuống dưới 150.000 VND',185000,150000,'VND'),
  ('kr-h1-1','obj-h1','eNPS ≥ 40 trong khảo sát Q1',32,40,'điểm'),
  ('kr-h1-2','obj-h1','Tỷ lệ giữ chân nhân viên ≥ 90%',87,90,'%'),
  ('kr-h1-3','obj-h1','Hoàn thành onboarding 100% nhân viên mới',67,100,'%')
ON CONFLICT (id) DO NOTHING;
