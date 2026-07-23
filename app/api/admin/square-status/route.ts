import { NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/permissions";
import { isSquareConfigured, listLocations, SquareError } from "@/lib/square/server";

/**
 * One-click Square connection check for owners/managers:
 * GET /api/admin/square-status — verifies the access token and
 * lists locations without exposing any secrets.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user, ["owner", "manager"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isSquareConfigured()) {
    return NextResponse.json({
      configured: false,
      message:
        "SQUARE_ACCESS_TOKEN is not set. Add the Square env vars and redeploy.",
    });
  }

  try {
    const locations = await listLocations();
    return NextResponse.json({
      configured: true,
      environment: process.env.SQUARE_ENVIRONMENT ?? "sandbox",
      webhookConfigured: Boolean(process.env.SQUARE_WEBHOOK_SIGNATURE_KEY),
      locations: locations.map((l) => ({
        id: l.id,
        name: l.name,
        status: l.status,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      {
        configured: true,
        error:
          err instanceof SquareError
            ? `Square API error (${err.status}) — check the token and environment.`
            : "Could not reach Square.",
      },
      { status: 502 },
    );
  }
}
