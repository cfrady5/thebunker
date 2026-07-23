import { redirect } from "next/navigation";

// /golf is a friendly alias for the simulator experience overview.
export default function GolfPage() {
  redirect("/simulators");
}
