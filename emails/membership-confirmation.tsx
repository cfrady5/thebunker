import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "@/emails/components/layout";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function MembershipConfirmationEmail({
  firstName,
  planName,
  includedMinutes,
}: {
  firstName: string;
  planName: string;
  includedMinutes: number;
}) {
  const hours = Math.round((includedMinutes / 60) * 10) / 10;
  return (
    <EmailLayout preview={`Welcome to ${planName} membership at The Bunker`}>
      <Text style={emailStyles.h1}>Welcome to the club, {firstName}!</Text>
      <Text style={emailStyles.p}>
        Your <strong>{planName}</strong> membership is active. Here&apos;s what you
        get every month:
      </Text>
      <Section style={emailStyles.summaryCard}>
        <Text style={emailStyles.summaryValue}>
          • {hours} hours of included simulator time
          <br />
          • Earlier booking windows
          <br />
          • Member discounts on extra hours and leagues
          <br />• Priority access to events and tournaments
        </Text>
      </Section>
      <Text style={emailStyles.p}>
        Included time applies automatically when you book. Manage your plan anytime
        from your account.
      </Text>
      <Button href={`${SITE_URL}/account/memberships`} style={emailStyles.button}>
        View My Membership
      </Button>
    </EmailLayout>
  );
}
