import { redirect } from "next/navigation";

// Lessons are managed in the programs area.
export default function AdminLessonsPage() {
  redirect("/admin/programs");
}
