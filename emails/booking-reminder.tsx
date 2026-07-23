import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "@/emails/components/layout";
import { formatFacility } from "@/lib/dates";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function BookingReminderEmail({
  firstName,
  bookingNumber,
  startsAtIso,
  endsAtIso,
  bookingId,
}: {
  firstName: string;
  bookingNumber: string;
  startsAtIso: string;
  endsAtIso: string;
  bookingId: string;
}) {
  return (
    <EmailLayout preview={`Reminder: your bay is booked for ${formatFacility(startsAtIso, "EEE 'at' h:mm a")}`}>
      <Text style={emailStyles.h1}>See you soon, {firstName}!</Text>
      <Text style={emailStyles.p}>
        A quick reminder about your upcoming session at The Bunker:
      </Text>
      <Section style={emailStyles.summaryCard}>
        <Text style={emailStyles.summaryLabel}>When</Text>
        <Text style={emailStyles.summaryValue}>
          {formatFacility(startsAtIso, "EEEE, MMMM d")} ·{" "}
          {formatFacility(startsAtIso, "h:mm a")} – {formatFacility(endsAtIso, "h:mm a")}
        </Text>
        <Text style={emailStyles.summaryLabel}>Reservation</Text>
        <Text style={{ ...emailStyles.summaryValue, marginBottom: 0 }}>
          {bookingNumber}
        </Text>
      </Section>
      <Button href={`${SITE_URL}/account/bookings/${bookingId}`} style={emailStyles.button}>
        Manage Reservation
      </Button>
      <Text style={{ ...emailStyles.p, marginTop: "20px" }}>
        Arrive about 10 minutes early. Bring your clubs or use ours — see you on
        the tee!
      </Text>
    </EmailLayout>
  );
}
