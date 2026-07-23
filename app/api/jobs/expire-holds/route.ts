import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Housekeeping job: expires stale checkout holds and abandoned
 * payment_pending bookings. Protected by CRON_SECRET.
 *
 * Correctness does not depend on cron frequency: the availability
 * engine ignores holds past their expires_at, the hold RPC expires
 * stale rows inline, and Stripe's checkout.session.expired webhook
 * releases abandoned payment_pending bookings. This job is backstop
 * cleanup — daily is fine on the Hobby plan; every 10 minutes is
 * nicer on Pro.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { data, error } = await admin.rpc("expire_stale_holds");
  if (error) {
    console.error("expire_stale_holds failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expiredHolds: data ?? 0 });
}
