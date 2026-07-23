import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Logo } from "@/components/brand/logo";
import { InlineAlert } from "@/components/feedback/inline-alert";

export const metadata = {
  title: { default: "Admin", template: "%s | The Bunker Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-lg">
          <div className="mb-6 flex justify-center">
            <Logo variant="shield" width={70} height={82} />
          </div>
          <InlineAlert variant="info" title="Admin not connected">
            The staff dashboard activates once Supabase is configured for this
            deployment.{" "}
            <Link href="/" className="font-medium text-primary underline underline-offset-2">
              Back to site
            </Link>
          </InlineAlert>
        </div>
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");

  // Server-side role gate — interface hiding alone is never enough.
  if (!isStaff(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md text-center">
          <Logo variant="shield" width={70} height={82} className="mx-auto" />
          <h1 className="mt-6 font-serif text-2xl font-semibold text-primary">
            Staff access only
          </h1>
          <p className="mt-2 text-sm text-charcoal-muted">
            Your account doesn&apos;t have staff permissions. If you believe this is
            a mistake, contact a manager.
          </p>
          <Link
            href="/account"
            className="mt-6 inline-block text-sm font-semibold text-primary underline underline-offset-2"
          >
            Go to my account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar
        userName={`${user.profile.first_name} ${user.profile.last_name}`.trim()}
        roles={user.roles}
      />
      <main id="main-content" className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
