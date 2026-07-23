"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { submitOpeningEmail } from "@/features/interest/actions";
import { homeCopy } from "@/lib/content/home";

/**
 * Email-only opening-list form for the homepage signup band.
 */
export function OpeningSignupForm() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const honeypotRef = React.useRef<HTMLInputElement>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/.+@.+\..+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    startTransition(async () => {
      const res = await submitOpeningEmail({
        email,
        company: honeypotRef.current?.value ?? "",
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(res.message);
      }
    });
  }

  if (success) {
    return (
      <p
        role="status"
        className="rounded-md border border-success/30 bg-success/10 px-5 py-4 text-[15px] leading-relaxed text-success"
      >
        {homeCopy.signup.success}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full">
      <input
        ref={honeypotRef}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-0">
        <div className="flex-1">
          <label htmlFor="opening-email" className="sr-only">
            Email address
          </label>
          <input
            id="opening-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={homeCopy.signup.placeholder}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "opening-email-error" : undefined}
            className="h-[52px] w-full rounded-md border border-border bg-surface px-4 text-[15px] text-charcoal placeholder:text-charcoal-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:rounded-r-none sm:border-r-0"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-7 text-sm font-semibold uppercase tracking-wider text-cream transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto sm:rounded-l-none"
        >
          {pending ? (
            <>
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> Joining…
            </>
          ) : (
            homeCopy.signup.button
          )}
        </button>
      </div>
      {error ? (
        <p id="opening-email-error" role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <p className="mt-3 text-[13px] leading-relaxed text-charcoal-muted">
        Opening updates only — no spam, unsubscribe anytime.
      </p>
    </form>
  );
}
