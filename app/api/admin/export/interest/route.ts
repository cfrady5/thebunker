import { NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** CSV export of opening-list signups (marketing roles only). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user, ["owner", "manager", "marketing"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { data } = await admin
    .from("interest_submissions")
    .select("first_name, last_name, email, phone, interests, email_consent, sms_consent, created_at")
    .order("created_at", { ascending: false });

  const header =
    "first_name,last_name,email,phone,interests,email_consent,sms_consent,created_at";
  const rows = (data ?? []).map((row) =>
    [
      csvEscape(row.first_name ?? ""),
      csvEscape(row.last_name ?? ""),
      csvEscape(row.email ?? ""),
      csvEscape(row.phone ?? ""),
      csvEscape((row.interests ?? []).join("; ")),
      String(row.email_consent),
      String(row.sms_consent),
      row.created_at,
    ].join(","),
  );

  return new NextResponse([header, ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bunker-opening-list.csv"`,
    },
  });
}
