-- ============================================================
--  AI Analysis Cache — run once in Supabase SQL Editor
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_cache (
  key        TEXT PRIMARY KEY,
  bullets    TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_ai_cache" ON public.ai_cache FOR ALL USING (true) WITH CHECK (true);
