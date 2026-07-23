"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { updateFacilityInfo, updateHero } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InlineAlert } from "@/components/feedback/inline-alert";

export function HeroForm({
  initial,
}: {
  initial: { eyebrow: string; headline: string; subheadline: string };
}) {
  const [values, setValues] = React.useState(initial);
  const [pending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(
    null,
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setResult(null);
        startTransition(async () => {
          setResult(await updateHero(values));
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="hero-eyebrow">Eyebrow</Label>
        <Input
          id="hero-eyebrow"
          value={values.eyebrow}
          onChange={(e) => setValues({ ...values, eyebrow: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hero-headline">Headline</Label>
        <Input
          id="hero-headline"
          value={values.headline}
          onChange={(e) => setValues({ ...values, headline: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hero-sub">Supporting copy</Label>
        <Textarea
          id="hero-sub"
          rows={3}
          value={values.subheadline}
          onChange={(e) => setValues({ ...values, subheadline: e.target.value })}
        />
      </div>
      {result ? (
        <InlineAlert variant={result.ok ? "success" : "error"}>
          {result.message}
        </InlineAlert>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 aria-hidden className="animate-spin" /> Saving…
          </>
        ) : (
          "Save Hero"
        )}
      </Button>
    </form>
  );
}

export function FacilityForm({
  initial,
}: {
  initial: {
    phone: string | null;
    email: string | null;
    address_line1: string | null;
    postal_code: string | null;
  };
}) {
  const [values, setValues] = React.useState({
    phone: initial.phone ?? "",
    email: initial.email ?? "",
    address_line1: initial.address_line1 ?? "",
    postal_code: initial.postal_code ?? "",
  });
  const [pending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(
    null,
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setResult(null);
        startTransition(async () => {
          setResult(
            await updateFacilityInfo({
              phone: values.phone || null,
              email: values.email || null,
              address_line1: values.address_line1 || null,
              postal_code: values.postal_code || null,
            }),
          );
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fac-phone">Phone</Label>
          <Input
            id="fac-phone"
            value={values.phone}
            onChange={(e) => setValues({ ...values, phone: e.target.value })}
            placeholder="(812) 555-0100"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fac-email">Public email</Label>
          <Input
            id="fac-email"
            type="email"
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fac-address">Street address</Label>
          <Input
            id="fac-address"
            value={values.address_line1}
            onChange={(e) => setValues({ ...values, address_line1: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fac-zip">ZIP code</Label>
          <Input
            id="fac-zip"
            value={values.postal_code}
            onChange={(e) => setValues({ ...values, postal_code: e.target.value })}
          />
        </div>
      </div>
      {result ? (
        <InlineAlert variant={result.ok ? "success" : "error"}>
          {result.message}
        </InlineAlert>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 aria-hidden className="animate-spin" /> Saving…
          </>
        ) : (
          "Save Contact Info"
        )}
      </Button>
    </form>
  );
}
