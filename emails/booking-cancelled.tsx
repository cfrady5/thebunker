import { Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "@/emails/components/layout";
import { formatFacility } from "@/lib/dates";

export function BookingCancelledEmail({
  firstName,
  bookingNumber,
  startsAtIso,
  refunded,
  creditCents,
}: {
  firstName: string;
  bookingNumber: string;
  startsAtIso: string;
  refunded: boolean;
  creditCents: number;
}) {
  return (
    <EmailLayout preview={`Reservation ${bookingNumber} cancelled`}>
      <Text style={emailStyles.h1}>Reservation cancelled</Text>
      <Text style={emailStyles.p}>
        Hi {firstName} — your reservation {bookingNumber} for{" "}
        {formatFacility(startsAtIso, "EEEE, MMMM d 'at' h:mm a")} has been cancelled.
      </Text>
      {refunded ? (
        <Text style={emailStyles.p}>
          A full refund is on its way to your original payment method. Depending on
          your bank, it may take 5–10 business days to appear.
        </Text>
      ) : creditCents > 0 ? (
        <Text style={emailStyles.p}>
          Because the cancellation was inside the 24-hour window, we&apos;ve added{" "}
          ${(creditCents / 100).toFixed(2)} to your account as credit — it applies
          automatically the next time you book.
        </Text>
      ) : null}
      <Text style={emailStyles.p}>We hope to see you at The Bunker soon!</Text>
    </EmailLayout>
  );
}
