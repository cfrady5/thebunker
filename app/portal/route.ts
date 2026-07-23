import { NextResponse } from "next/server";

/**
 * Short employee-portal link: /portal → staff dashboard. The admin
 * layout enforces sign-in and staff roles from there.
 */
export function GET(request: Request) {
  return NextResponse.redirect(new URL("/admin", request.url));
}
