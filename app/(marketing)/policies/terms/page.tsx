import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description:
    "The terms covering accounts, reservations, memberships and facility use at The Bunker Indoor Golf.",
  path: "/policies/terms",
});

export default function TermsPage() {
  return (
    <section className="container max-w-3xl py-14 md:py-20">
      <h1 className="text-display-md font-semibold text-primary">Terms of Service</h1>
      <div className="prose-policies mt-4">
        <p>
          These terms govern use of The Bunker&apos;s website, reservations and
          facility. A final version will be reviewed by counsel before launch.
        </p>

        <h2>Accounts</h2>
        <ul>
          <li>You&apos;re responsible for keeping your login credentials secure.</li>
          <li>Account holders must be 18 or older; minors participate through a parent or guardian&apos;s household.</li>
          <li>Information you provide must be accurate and current.</li>
        </ul>

        <h2>Reservations and payments</h2>
        <ul>
          <li>Bay time is sold per bay in the increments shown at booking.</li>
          <li>Prices include posted taxes and are charged at the time of booking through Stripe.</li>
          <li>The cancellation policy in effect at booking time applies to each reservation.</li>
        </ul>

        <h2>Memberships</h2>
        <ul>
          <li>Memberships renew automatically each billing period until cancelled.</li>
          <li>Included time and benefits follow the plan description at signup; we&apos;ll give notice before material changes.</li>
          <li>You can cancel or pause from your account; access continues through the paid period.</li>
        </ul>

        <h2>Facility conduct</h2>
        <ul>
          <li>Follow staff direction and posted safety rules, especially in hitting areas.</li>
          <li>We may refuse service for unsafe or abusive behavior.</li>
          <li>Outside alcohol is not permitted.</li>
        </ul>

        <h2>Gift cards and credits</h2>
        <ul>
          <li>Gift cards are redeemable for goods and services at The Bunker and are not redeemable for cash except where required by law.</li>
          <li>Promotional credits may carry expiration dates shown at issuance.</li>
        </ul>

        <h2>Contact</h2>
        <p>Questions about these terms? Contact us through the website and we&apos;ll help.</p>
      </div>
    </section>
  );
}
