-- ============================================================
--  KR Documents – Supabase Storage & Metadata
--  Paste this in the Supabase SQL Editor and click "Run"
-- ============================================================

-- ── 1. Storage bucket (chỉ cho phép PDF) ─────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kr-documents',
  'kr-documents',
  true,                          -- public read (signed URLs also work)
  10485760,                      -- 10 MB limit per file
  ARRAY['application/pdf','image/png','image/jpeg']  -- PDF + ảnh
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit    = EXCLUDED.file_size_limit;

-- ── 2. Storage RLS policies (open for now) ────────────────────

CREATE POLICY "allow_public_read_kr_docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kr-documents');

CREATE POLICY "allow_public_insert_kr_docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'kr-documents');

CREATE POLICY "allow_public_delete_kr_docs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'kr-documents');

-- ── 3. Metadata table ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.kr_documents (
  id          TEXT PRIMARY KEY,
  kr_id       TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  file_path   TEXT NOT NULL,        -- storage path in bucket
  file_size   INTEGER NOT NULL DEFAULT 0,
  uploaded_at TEXT NOT NULL          -- ISO timestamp
);

ALTER TABLE public.kr_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_kr_documents"
  ON public.kr_documents FOR ALL
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_kr_documents_kr
  ON public.kr_documents(kr_id);
