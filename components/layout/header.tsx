import { getCurrentUser } from "@/lib/permissions";
import { HeaderShell } from "@/components/layout/header-shell";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return <HeaderShell signedIn={Boolean(user)} />;
}
