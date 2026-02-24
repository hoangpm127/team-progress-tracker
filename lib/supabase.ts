import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/** Returns the singleton Supabase client.
 *  Throws a clear error only at *runtime* (when actually called),
 *  so `next build` succeeds even without .env.local present. */
export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars. Create .env.local with:\n" +
      "  NEXT_PUBLIC_SUPABASE_URL=...\n" +
      "  NEXT_PUBLIC_SUPABASE_ANON_KEY=..."
    );
  }

  _client = createClient(url, key);
  return _client;
}

/** Convenience re-export — use only in client components / server actions */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
