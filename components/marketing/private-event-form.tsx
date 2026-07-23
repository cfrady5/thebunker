"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  privateEventInquirySchema,
  type PrivateEventInquiryInput,
} from "@/lib/validation/schemas";
import { submitPrivateEventInquiry } from "@/features/private-events/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InlineAlert } from "@/components/feedback/inline-alert";

const EVENT_TYPES = [
  "Birthday",
  "Corporate outing",
  "Team building",
  "Church group",
  "Fundraiser",
  "Family gathering",
  "Youth party",
  "Private tournament",
  "Holiday event",
  "Other",
] as const;

function Field({
  label,
  htmlFor,
  error,
  children,
  optional = false,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function PrivateEventForm() {
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [pending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PrivateEventInquiryInput>({
    resolver: zodResolver(privateEventInquirySchema),
    defaultValues: { event_type: "Birthday", company: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setResult(null);
    startTransition(async () => {
      const res = await submitPrivateEventInquiry(values);
      setResult(res);
      if (res.ok) reset();
    });
  });

  if (result?.ok) {
    return (
      <InlineAlert variant="success" title="Inquiry received!">
        {result.message}
      </InlineAlert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        {...register("company")}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="pe-name" error={errors.contact_name?.message}>
          <Input id="pe-name" autoComplete="name" {...register("contact_name")} />
        </Field>
        <Field
          label="Organization"
          htmlFor="pe-org"
          optional
          error={errors.organization?.message}
        >
          <Input id="pe-org" autoComplete="organization" {...register("organization")} />
        </Field>
        <Field label="Email" htmlFor="pe-email" error={errors.email?.message}>
          <Input id="pe-email" type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Phone" htmlFor="pe-phone" optional error={errors.phone?.message}>
          <Input id="pe-phone" type="tel" autoComplete="tel" {...register("phone")} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Event type" htmlFor="pe-type" error={errors.event_type?.message}>
          <Select id="pe-type" {...register("event_type")}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Estimated guests"
          htmlFor="pe-guests"
          optional
          error={errors.guest_count?.message}
        >
          <Input
            id="pe-guests"
            type="number"
            min={1}
            max={500}
            inputMode="numeric"
            {...register("guest_count", {
              setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
            })}
          />
        </Field>
        <Field
          label="Preferred date"
          htmlFor="pe-date"
          optional
          error={errors.preferred_date?.message}
        >
          <Input id="pe-date" type="date" {...register("preferred_date")} />
        </Field>
        <Field
          label="Backup date"
          htmlFor="pe-alt-date"
          optional
          error={errors.alternate_date?.message}
        >
          <Input id="pe-alt-date" type="date" {...register("alternate_date")} />
        </Field>
        <Field
          label="Preferred start time"
          htmlFor="pe-time"
          optional
          error={errors.preferred_time?.message}
        >
          <Input id="pe-time" placeholder="e.g. 6:00 PM" {...register("preferred_time")} />
        </Field>
        <Field
          label="Bays needed"
          htmlFor="pe-bays"
          optional
          error={errors.bay_count?.message}
        >
          <Input
            id="pe-bays"
            type="number"
            min={1}
            max={10}
            inputMode="numeric"
            {...register("bay_count", {
              setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
            })}
          />
        </Field>
      </div>

      <Field
        label="Food & drink needs"
        htmlFor="pe-food"
        optional
        error={errors.food_and_drink_needs?.message}
      >
        <Textarea
          id="pe-food"
          rows={2}
          placeholder="Appetizers for 20, drinks package, birthday cake table…"
          {...register("food_and_drink_needs")}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Budget range"
          htmlFor="pe-budget"
          optional
          error={errors.budget_range?.message}
        >
          <Input id="pe-budget" placeholder="e.g. $300–500" {...register("budget_range")} />
        </Field>
        <Field
          label="Accessibility needs"
          htmlFor="pe-access"
          optional
          error={errors.accessibility_needs?.message}
        >
          <Input id="pe-access" {...register("accessibility_needs")} />
        </Field>
      </div>

      <Field label="Anything else?" htmlFor="pe-notes" optional error={errors.notes?.message}>
        <Textarea
          id="pe-notes"
          rows={3}
          placeholder="Tell us about the occasion, the group, or anything that would make it great."
          {...register("notes")}
        />
      </Field>

      {result && !result.ok ? (
        <InlineAlert variant="error">{result.message}</InlineAlert>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <>
            <Loader2 aria-hidden className="animate-spin" /> Sending…
          </>
        ) : (
          "Send Inquiry"
        )}
      </Button>
    </form>
  );
}
