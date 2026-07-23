import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How The Bunker Indoor Golf collects, uses and protects your information.",
  path: "/policies/privacy",
});

export default function PrivacyPolicyPage() {
  return (
    <section className="container max-w-3xl py-14 md:py-20">
      <h1 className="text-display-md font-semibold text-primary">Privacy Policy</h1>
      <div className="prose-policies mt-4">
        <p>
          This policy explains what information The Bunker Indoor Golf
          (&quot;we&quot;) collects through this website and how we use it. A final
          version will be reviewed by counsel before launch.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account information</strong> — name, email, phone and the
            preferences you save (handedness, skill level, household members you
            add).
          </li>
          <li>
            <strong>Reservations and purchases</strong> — bookings, registrations,
            membership status and payment history. Card details are processed by
            Stripe and never stored on our servers.
          </li>
          <li>
            <strong>Youth program data</strong> — participant details, emergency
            contacts and any notes a guardian shares, used only to run the program
            safely.
          </li>
          <li>
            <strong>Marketing signups</strong> — the interests you select on the
            opening list, only with your explicit consent.
          </li>
          <li>
            <strong>Usage analytics</strong> — aggregate site analytics to improve
            the experience.
          </li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>To run your reservations, memberships and registrations.</li>
          <li>To send transactional email (confirmations, reminders, receipts).</li>
          <li>To send marketing email or SMS only if you opted in — every message includes an unsubscribe option.</li>
          <li>To keep the facility safe and meet legal obligations.</li>
        </ul>

        <h2>What we don&apos;t do</h2>
        <ul>
          <li>We don&apos;t sell your personal information.</li>
          <li>We don&apos;t store card numbers.</li>
          <li>We don&apos;t publish photos of youth participants without consent.</li>
        </ul>

        <h2>Your choices</h2>
        <p>
          You can update your profile, change communication preferences or request
          account deletion anytime from your account&apos;s security page, or by
          contacting us.
        </p>
      </div>
    </section>
  );
}
