import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Refreshes the Supabase auth session on every matched request so the
 * access token stays fresh and its rotated cookies are written back to
 * the browser.
 *
 * It does NOT gate protected routes on the edge: a transient getUser
 * failure (a token-refresh race at the edge) must not bounce a
 * signed-in user to /login on every navigation. The authoritative
 * server-side gate lives in the /account and /admin layouts, which run
 * in the stable serverless runtime and redirect when there is truly no
 * user. The edge only redirects when there is no session cookie at all
 * — i.e. a genuinely signed-out visitor — for a clean login hand-off.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Supabase unconfigured: protected areas show their own notice.
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>,
      ) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh the session (rotates + re-writes cookies). Tolerate a
  // transient failure — never let it bounce a valid session.
  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    user = null;
  }

  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith("/account") || pathname.startsWith("/admin");

  // A present session cookie means "let the layout decide". Only the
  // fully-signed-out case (no cookie at all) redirects here.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));

  if (isProtected && !user && !hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except API routes, static assets and images.
    "/((?!api|_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico)$).*)",
  ],
};
