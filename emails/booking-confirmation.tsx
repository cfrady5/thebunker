import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "@/emails/components/layout";
import { formatFacility } from "@/lib/dates";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function BookingConfirmationEmail({
  firstName,
  bookingNumber,
  startsAtIso,
  endsAtIso,
  playerCount,
  totalCents,
  bookingId,
}: {
  firstName: string;
  bookingNumber: string;
  startsAtIso: string;
  endsAtIso: string;
  playerCount: number;
  totalCents: number;
  bookingId: string;
}) {
  return (
    <EmailLayout preview={`You're booked for ${formatFacility(startsAtIso, "EEE, MMM d 'at' h:mm a")}`}>
      <Text style={emailStyles.h1}>You&apos;re booked, {firstName}!</Text>
      <Text style={emailStyles.p}>
        Your simulator bay is reserved. Here are the details:
      </Text>

      <Section style={emailStyles.summaryCard}>
        <Text style={emailStyles.summaryLabel}>Reservation</Text>
        <Text style={emailStyles.summaryValue}>{bookingNumber}</Text>
        <Text style={emailStyles.summaryLabel}>Date &amp; time</Text>
        <Text style={emailStyles.summaryValue}>
          {formatFacility(startsAtIso, "EEEE, MMMM d, yyyy")}
          <br />
          {formatFacility(startsAtIso, "h:mm a")} – {formatFacility(endsAtIso, "h:mm a")}
        </Text>
        <Text style={emailStyles.summaryLabel}>Players</Text>
        <Text style={emailStyles.summaryValue}>Up to {playerCount}</Text>
        <Text style={emailStyles.summaryLabel}>Total paid</Text>
        <Text style={{ ...emailStyles.summaryValue, marginBottom: 0 }}>
          ${(totalCents / 100).toFixed(2)}
        </Text>
      </Section>

      <Button href={`${SITE_URL}/account/bookings/${bookingId}`} style={emailStyles.button}>
        Manage Reservation
      </Button>

      <Text style={{ ...emailStyles.p, marginTop: "20px" }}>
        <strong>Good to know:</strong> arrive about 10 minutes early for your first
        visit so we can get you set up. Bring your own clubs or use ours — either
        works. Cancel or reschedule anytime up to 24 hours before your session for
        a full refund.
      </Text>
    </EmailLayout>
  );
}
