-- ============================================================
--  Bảng phân quyền truy cập — access_codes
--  Chạy file này trong Supabase SQL Editor
--  Yêu cầu: extension pgcrypto (bật mặc định trên Supabase)
-- ============================================================

-- 1. Bật pgcrypto (nếu chưa có)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Tạo bảng
CREATE TABLE IF NOT EXISTS public.access_codes (
  id         TEXT PRIMARY KEY,
  code_hash  TEXT NOT NULL UNIQUE,   -- SHA-256 hex của mã thực
  role       TEXT NOT NULL CHECK (role IN ('leader','admin_step1','admin_step2')),
  label      TEXT NOT NULL,           -- tên hiển thị sau khi đăng nhập
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Row Level Security — anon chỉ được SELECT, không được ghi
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- Cho phép anon đọc (cần để verify code từ client)
CREATE POLICY "allow_select" ON public.access_codes
  FOR SELECT USING (true);

-- Chặn toàn bộ ghi từ anon/authenticated (chỉ service_role mới sửa được)
CREATE POLICY "deny_insert" ON public.access_codes FOR INSERT WITH CHECK (false);
CREATE POLICY "deny_update" ON public.access_codes FOR UPDATE USING (false);
CREATE POLICY "deny_delete" ON public.access_codes FOR DELETE USING (false);

-- 4. Seed: mã đã hash bằng SHA-256 (pgcrypto)
--    ⚠️  THAY BẰNG MÃ MỚI TRƯỚC KHI DÙNG THẬT — xem README
INSERT INTO public.access_codes (id, code_hash, role, label) VALUES
  (
    'leader_mkt',
    encode(digest('mK7pR2x', 'sha256'), 'hex'),
    'leader',
    'Marketing / Thương mại'
  ),
  (
    'leader_tec',
    encode(digest('nT4vW8c', 'sha256'), 'hex'),
    'leader',
    'Công nghệ'
  ),
  (
    'leader_htc',
    encode(digest('sA9eJ3m', 'sha256'), 'hex'),
    'leader',
    'Hợp tác / Đối tác'
  ),
  (
    'admin_step1',
    encode(digest('Xb6qL1F', 'sha256'), 'hex'),
    'admin_step1',
    'Admin'
  ),
  (
    'admin_step2',
    encode(digest('Kd5wP7r', 'sha256'), 'hex'),
    'admin_step2',
    'Admin PIN'
  )
ON CONFLICT (id) DO NOTHING;
