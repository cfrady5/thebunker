"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { interestSchema, INTEREST_OPTIONS } from "@/lib/validation/schemas";
import type { InterestInput } from "@/lib/validation/schemas";
import { submitInterest } from "@/features/interest/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { cn } from "@/lib/utils";

/**
 * Opening-list signup form. `compact` renders the abbreviated
 * footer variant; the full variant includes interest checkboxes.
 */
export function NewsletterForm({
  compact = false,
  dark = compact,
}: {
  compact?: boolean;
  /** Renders labels/copy for a dark background (footer). */
  dark?: boolean;
}) {
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [pending, startTransition] = React.useTransition();

  const form = useForm<InterestInput>({
    resolver: zodResolver(interestSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      interests: [],
      email_consent: false,
      sms_consent: false,
      company: "",
    },
  });

  const { register, handleSubmit, setValue, watch, formState } = form;
  const errors = formState.errors;
  const interests = watch("interests");

  const onSubmit = handleSubmit((values) => {
    setResult(null);
    startTransition(async () => {
      const res = await submitInterest(values);
      setResult(res);
      if (res.ok) form.reset();
    });
  });

  if (result?.ok) {
    return (
      <InlineAlert variant="success" title="Welcome to the list!">
        {result.message}
      </InlineAlert>
    );
  }

  const idPrefix = compact ? "footer-nl" : "nl";

  return (
    <form onSubmit={onSubmit} noValidate className={cn(compact ? "space-y-3" : "space-y-5")}>
      {/* Honeypot — hidden from real users and screen readers. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        {...register("company")}
      />

      <div className={cn("grid gap-3", !compact && "sm:grid-cols-2")}>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-first`} className={cn(dark && "text-cream/90")}>
            First name
          </Label>
          <Input
            id={`${idPrefix}-first`}
            autoComplete="given-name"
            aria-invalid={Boolean(errors.first_name)}
            {...register("first_name")}
          />
          {errors.first_name ? (
            <p role="alert" className="text-xs text-danger">
              {errors.first_name.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-last`} className={cn(dark && "text-cream/90")}>
            Last name
          </Label>
          <Input
            id={`${idPrefix}-last`}
            autoComplete="family-name"
            aria-invalid={Boolean(errors.last_name)}
            {...register("last_name")}
          />
          {errors.last_name ? (
            <p role="alert" className="text-xs text-danger">
              {errors.last_name.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-email`} className={cn(dark && "text-cream/90")}>
          Email
        </Label>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email ? (
          <p role="alert" className="text-xs text-danger">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      {!compact ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-phone`}>Mobile number (optional)</Label>
            <Input
              id={`${idPrefix}-phone`}
              type="tel"
              autoComplete="tel"
              aria-invalid={Boolean(errors.phone)}
              {...register("phone")}
            />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-charcoal">
              What are you interested in?
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {INTEREST_OPTIONS.map((opt) => {
                const checked = interests?.includes(opt) ?? false;
                return (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border/40 bg-surface px-3 py-2 text-sm transition-colors hover:border-gold/60"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const next = v
                          ? [...(interests ?? []), opt]
                          : (interests ?? []).filter((i) => i !== opt);
                        setValue("interests", next, { shouldValidate: true });
                      }}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </>
      ) : null}

      <div className="space-y-2">
        <label
          className={cn(
            "flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed",
            dark ? "text-cream/70" : "text-charcoal-muted",
          )}
        >
          <Checkbox
            checked={watch("email_consent")}
            onCheckedChange={(v) =>
              setValue("email_consent", Boolean(v), { shouldValidate: true })
            }
            aria-invalid={Boolean(errors.email_consent)}
          />
          <span>
            Yes, email me opening news and updates from The Bunker. Unsubscribe anytime.
          </span>
        </label>
        {errors.email_consent ? (
          <p role="alert" className="text-xs text-danger">
            {errors.email_consent.message}
          </p>
        ) : null}
      </div>

      {result && !result.ok ? (
        <InlineAlert variant="error">{result.message}</InlineAlert>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        variant={dark ? "gold" : "default"}
        className={cn(compact && "w-full")}
      >
        {pending ? (
          <>
            <Loader2 aria-hidden className="animate-spin" /> Joining…
          </>
        ) : (
          "Join the Opening List"
        )}
      </Button>
    </form>
  );
}
