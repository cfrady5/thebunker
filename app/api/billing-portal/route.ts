import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { getCurrentUser } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo/metadata";

/**
 * Redirects a signed-in member to the Stripe Customer Portal for
 * self-service billing management.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/account/memberships", SITE_URL));
  }

  const stripe = getStripe();
  const supabase = await createSupabaseServerClient();
  if (!stripe || !supabase) {
    return NextResponse.redirect(
      new URL("/account/memberships?error=billing_unavailable", SITE_URL),
    );
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("stripe_customer_id")
    .eq("profile_id", user.profile.id)
    .not("stripe_customer_id", "is", null)
    .limit(1)
    .maybeSingle();

  if (!membership?.stripe_customer_id) {
    return NextResponse.redirect(
      new URL("/account/memberships?error=no_billing_account", SITE_URL),
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: membership.stripe_customer_id,
    return_url: `${SITE_URL}/account/memberships`,
  });

  return NextResponse.redirect(session.url);
}
