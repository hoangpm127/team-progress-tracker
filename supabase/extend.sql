-- ============================================================
--  Thiên–Địa–Nhân Ecosystem Tree — Extended Schema
--  Paste & Run in Supabase SQL Editor
-- ============================================================

-- ── Projects (Technology / Trunk — 30 projects) ─────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea','building','live')),
  owner          TEXT NOT NULL DEFAULT '',
  last_update_at TEXT NOT NULL DEFAULT ''
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

-- ── Partners (Grass / Partnerships, 4 categories) ────────────
CREATE TABLE IF NOT EXISTS public.partners (
  id         TEXT PRIMARY KEY,
  category   INTEGER NOT NULL CHECK (category BETWEEN 1 AND 4),
  name       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pipeline' CHECK (status IN ('active','pipeline')),
  created_at TEXT NOT NULL DEFAULT ''
);
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_partners" ON public.partners FOR ALL USING (true) WITH CHECK (true);

-- ── Market (Soil / singleton row) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.market (
  id           TEXT PRIMARY KEY DEFAULT 'singleton',
  market_index INTEGER NOT NULL DEFAULT 55,
  notes        TEXT NOT NULL DEFAULT '',
  updated_at   TEXT NOT NULL DEFAULT ''
);
ALTER TABLE public.market ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_market" ON public.market FOR ALL USING (true) WITH CHECK (true);

-- ── Heaven Timing (Rain / singleton row) ─────────────────────
CREATE TABLE IF NOT EXISTS public.heaven_timing (
  id                   TEXT PRIMARY KEY DEFAULT 'singleton',
  heaven_timing_index  INTEGER NOT NULL DEFAULT 60,
  rain_enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at           TEXT NOT NULL DEFAULT ''
);
ALTER TABLE public.heaven_timing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_heaven" ON public.heaven_timing FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
--  Seed data
-- ============================================================

INSERT INTO public.market(id, market_index, notes, updated_at)
VALUES ('singleton', 55, 'Thị trường Q1/2026 tích cực — SME tăng trưởng 12% YoY', '2026-02-25')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.heaven_timing(id, heaven_timing_index, rain_enabled, updated_at)
VALUES ('singleton', 60, true, '2026-02-25')
ON CONFLICT (id) DO NOTHING;

-- 30 seed projects
INSERT INTO public.projects (id, name, status, owner, last_update_at) VALUES
  ('p01','Xgroup Platform Web','live','Tech Team','2026-02-20'),
  ('p02','Xgroup Mobile App','building','Tech Team','2026-02-22'),
  ('p03','AI Content Assistant','building','Tech Team','2026-02-18'),
  ('p04','Partner Management System','live','Tech Team','2026-02-15'),
  ('p05','Payment Gateway Integration','live','Tech Team','2026-02-10'),
  ('p06','Business Intelligence Dashboard','building','Tech Team','2026-02-20'),
  ('p07','Developer API Marketplace','building','Tech Team','2026-02-12'),
  ('p08','Internal CRM System','live','Tech Team','2026-02-08'),
  ('p09','Cloud Infrastructure v2','building','Tech Team','2026-02-19'),
  ('p10','Security & Auth Service','live','Tech Team','2026-02-14'),
  ('p11','Data Analytics Pipeline','building','Tech Team','2026-02-21'),
  ('p12','Notification Service','live','Tech Team','2026-02-09'),
  ('p13','Search & Recommendation','idea','Tech Team','2026-02-16'),
  ('p14','Multi-tenancy Architecture','idea','Tech Team','2026-02-05'),
  ('p15','DevOps & CI/CD Pipeline','live','Tech Team','2026-02-11'),
  ('p16','Brand Campaign Q1','building','Marketing','2026-02-22'),
  ('p17','Social Media Automation','live','Marketing','2026-02-18'),
  ('p18','Content Marketing Hub','building','Marketing','2026-02-17'),
  ('p19','Talent Acquisition System','building','HR','2026-02-20'),
  ('p20','E-learning Platform','building','HR','2026-02-19'),
  ('p21','HR Analytics Dashboard','idea','HR','2026-02-10'),
  ('p22','Strategic Alliance A','live','Partnerships','2026-02-23'),
  ('p23','Market Expansion SEA','building','Partnerships','2026-02-21'),
  ('p24','B2B Partnership Portal','idea','Partnerships','2026-02-08'),
  ('p25','Executive Reporting Suite','live','BOD','2026-02-20'),
  ('p26','Piano Education App','building','Piano','2026-02-22'),
  ('p27','Sheet Music Engine','building','Piano','2026-02-21'),
  ('p28','AI Music Assistant','idea','Piano','2026-02-15'),
  ('p29','Community Forum Platform','idea','Tech Team','2026-02-12'),
  ('p30','Cross-sell Recommendation Engine','idea','Tech Team','2026-02-14')
ON CONFLICT (id) DO NOTHING;

-- Seed partners (4 categories)
INSERT INTO public.partners (id, category, name, status, created_at) VALUES
  ('pr01',1,'Công ty CP Cung ứng ABC','active','2026-01-10'),
  ('pr02',1,'Nhà phân phối XYZ','active','2026-01-15'),
  ('pr03',1,'Supplier DEF Corp','pipeline','2026-02-01'),
  ('pr04',2,'Headhunter VN','active','2026-01-20'),
  ('pr05',2,'HR Solutions Co.','active','2026-02-05'),
  ('pr06',2,'Talent Pool Group','pipeline','2026-02-10'),
  ('pr07',3,'Innovation Hub HN','active','2026-01-12'),
  ('pr08',3,'Training Academy Pro','active','2026-01-25'),
  ('pr09',3,'Consultant Network Asia','pipeline','2026-02-08'),
  ('pr10',4,'Quỹ đầu tư ABC Capital','active','2026-01-08'),
  ('pr11',4,'Financial Partner DEF','pipeline','2026-02-12')
ON CONFLICT (id) DO NOTHING;
