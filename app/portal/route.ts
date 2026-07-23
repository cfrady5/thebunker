import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/seo/metadata";

/**
 * Short employee-portal link: /portal → staff dashboard. The admin
 * layout enforces sign-in and staff roles from there.
 */
export function GET() {
  return NextResponse.redirect(new URL("/admin", SITE_URL));
}
