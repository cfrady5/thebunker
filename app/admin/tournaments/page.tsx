import { redirect } from "next/navigation";

// Tournaments are managed alongside leagues (shared data model).
export default function AdminTournamentsPage() {
  redirect("/admin/leagues");
}
