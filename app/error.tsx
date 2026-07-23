"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in server logs / error monitoring (Sentry when configured).
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <h1 className="font-serif text-display-md font-semibold text-primary">
        Something went sideways.
      </h1>
      <p className="mt-3 max-w-md text-charcoal-muted">
        An unexpected error occurred. Your data is safe — try again, and if it
        keeps happening, let us know.
      </p>
      <div className="mt-8">
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}
