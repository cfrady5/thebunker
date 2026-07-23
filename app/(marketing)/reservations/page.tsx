import { redirect } from "next/navigation";

// Canonical reservations experience lives at /book.
export default function ReservationsPage() {
  redirect("/book");
}
