import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

/**
 * Cookieless anon Supabase client for public, session-independent
 * reads (published events, active leagues, menu, etc.).
 *
 * Unlike the request-scoped server client, this never calls
 * `cookies()`, so it is safe in build-time contexts such as
 * `generateStaticParams` and `sitemap()` where there is no request
 * scope. Row Level Security still applies via the anon role, which
 * only exposes public content. Returns null when Supabase is not
 * configured.
 */
export function createSupabaseStaticClient() {
  if (!isSupabaseConfigured()) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
