import { NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** CSV export of bookings (owner/manager only). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user, ["owner", "manager"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { data } = await admin
    .from("bookings")
    .select(
      "booking_number, starts_at, ends_at, status, booking_type, player_count, subtotal_cents, tax_cents, discount_cents, total_cents, created_at",
    )
    .order("starts_at", { ascending: false })
    .limit(5000);

  const header =
    "booking_number,starts_at,ends_at,status,type,players,subtotal,tax,discount,total,created_at";
  const rows = (data ?? []).map((b) =>
    [
      b.booking_number,
      b.starts_at,
      b.ends_at,
      b.status,
      b.booking_type,
      b.player_count,
      (b.subtotal_cents / 100).toFixed(2),
      (b.tax_cents / 100).toFixed(2),
      (b.discount_cents / 100).toFixed(2),
      (b.total_cents / 100).toFixed(2),
      b.created_at,
    ].join(","),
  );

  return new NextResponse([header, ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bunker-bookings.csv"`,
    },
  });
}
