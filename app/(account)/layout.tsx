import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SiteHeader } from "@/components/layout/header";
import { SiteFooter } from "@/components/layout/footer";
import { AccountNav } from "@/components/account/account-nav";
import { InlineAlert } from "@/components/feedback/inline-alert";

// Account pages are always personalized — never statically prerender.
export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main id="main-content" className="container flex-1 py-16">
          <div className="mx-auto max-w-lg">
            <InlineAlert variant="info" title="Accounts not connected">
              Customer accounts aren&apos;t connected on this preview deployment.
              Once Supabase is configured, sign-in and the dashboard activate
              automatically.{" "}
              <Link href="/" className="font-medium text-primary underline underline-offset-2">
                Back to home
              </Link>
            </InlineAlert>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/account");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="container flex-1 py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <AccountNav />
          <div className="min-w-0">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
