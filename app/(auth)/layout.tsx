import Link from "next/link";
import { BrandWordmark } from "@/components/brand/wordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-primary-dark">
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center px-4 py-12"
      >
        <Link href="/" aria-label="The Bunker Indoor Golf — home">
          <BrandWordmark width={190} priority />
        </Link>
        <div className="mt-8 w-full max-w-md rounded-lg bg-surface p-6 shadow-card-hover sm:p-8">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-cream/60">
          <Link href="/" className="hover:text-cream">
            ← Back to The Bunker
          </Link>
        </p>
      </main>
    </div>
  );
}
