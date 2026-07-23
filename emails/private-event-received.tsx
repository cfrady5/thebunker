import { Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "@/emails/components/layout";

export function PrivateEventReceivedEmail({
  contactName,
  eventType,
  preferredDate,
  staffCopy = false,
}: {
  contactName: string;
  eventType: string;
  preferredDate: string | null;
  staffCopy?: boolean;
}) {
  if (staffCopy) {
    return (
      <EmailLayout preview={`New inquiry: ${eventType} from ${contactName}`}>
        <Text style={emailStyles.h1}>New private event inquiry</Text>
        <Text style={emailStyles.p}>
          <strong>{contactName}</strong> submitted a {eventType.toLowerCase()} inquiry
          {preferredDate ? ` for ${preferredDate}` : ""}. Full details are in the
          admin dashboard under Private Events. Reply to this email to reach them
          directly.
        </Text>
      </EmailLayout>
    );
  }

  return (
    <EmailLayout preview="Your event inquiry is in — we'll be in touch soon.">
      <Text style={emailStyles.h1}>Thanks, {contactName}!</Text>
      <Text style={emailStyles.p}>
        We received your {eventType.toLowerCase()} inquiry
        {preferredDate ? ` for ${preferredDate}` : ""} and we&apos;re excited to
        help you plan it.
      </Text>
      <Text style={emailStyles.p}>
        A member of our team will reach out within two business days to talk
        through group size, bays, food and drinks, and pricing. If plans change in
        the meantime, just reply to this email.
      </Text>
      <Text style={emailStyles.p}>
        Jay &amp; Amanda
        <br />
        The Bunker Indoor Golf
      </Text>
    </EmailLayout>
  );
}
