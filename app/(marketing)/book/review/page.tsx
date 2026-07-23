import { redirect } from "next/navigation";

// The booking flow is a single guided stepper at /book; deep links
// to individual steps return to the flow so state is never lost.
export default function BookingStepRedirect() {
  redirect("/book");
}
