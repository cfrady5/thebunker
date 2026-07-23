import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <Logo variant="shield" width={90} height={105} />
      <h1 className="mt-8 font-serif text-display-md font-semibold text-primary">
        Looks like that one landed in the bunker.
      </h1>
      <p className="mt-3 max-w-md text-charcoal-muted">
        The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s
        get you back on the fairway.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/contact">Contact Us</Link>
        </Button>
      </div>
    </div>
  );
}
