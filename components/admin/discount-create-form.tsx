"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createDiscountCode } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { InlineAlert } from "@/components/feedback/inline-alert";

export function DiscountCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [type, setType] = React.useState<"percentage" | "fixed_amount">("percentage");
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const rawValue = Number(fd.get("value"));
    if (!Number.isFinite(rawValue) || rawValue <= 0) {
      setError("Enter a positive value.");
      return;
    }
    const value =
      type === "fixed_amount" ? Math.round(rawValue * 100) : Math.round(rawValue);
    const limitRaw = String(fd.get("usage_limit") ?? "").trim();
    const input = {
      code: String(fd.get("code") ?? "").trim(),
      discount_type: type,
      value,
      usage_limit: limitRaw ? Number(limitRaw) : null,
      starts_at: (String(fd.get("starts_at") ?? "") || undefined) as string | undefined,
      expires_at: (String(fd.get("expires_at") ?? "") || undefined) as string | undefined,
    };
    if (!input.code) {
      setError("Enter a code.");
      return;
    }
    startTransition(async () => {
      const res = await createDiscountCode(input);
      if (res.ok) {
        setOk(res.message);
        form.reset();
        setType("percentage");
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mb-8 rounded-lg border border-border/40 bg-surface p-5"
    >
      <h2 className="font-serif text-lg font-semibold text-primary">
        Add a discount code
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="dc-code">Code</Label>
          <Input
            id="dc-code"
            name="code"
            placeholder="SUMMER10"
            className="uppercase"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dc-type">Type</Label>
          <Select
            id="dc-type"
            value={type}
            onChange={(e) => setType(e.target.value as "percentage" | "fixed_amount")}
          >
            <option value="percentage">Percentage off</option>
            <option value="fixed_amount">Fixed amount off</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dc-value">
            {type === "percentage" ? "Percent (1–100)" : "Amount ($)"}
          </Label>
          <Input
            id="dc-value"
            name="value"
            type="number"
            min="0"
            step={type === "percentage" ? "1" : "0.01"}
            placeholder={type === "percentage" ? "10" : "5.00"}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dc-limit">
            Usage limit{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="dc-limit" name="usage_limit" type="number" min="1" placeholder="Unlimited" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dc-start">
            Starts <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="dc-start" name="starts_at" type="date" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dc-expire">
            Expires <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="dc-expire" name="expires_at" type="date" />
        </div>
      </div>

      {error ? (
        <div className="mt-4">
          <InlineAlert variant="error">{error}</InlineAlert>
        </div>
      ) : null}
      {ok ? (
        <div className="mt-4">
          <InlineAlert variant="success">{ok}</InlineAlert>
        </div>
      ) : null}

      <div className="mt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create code"}
        </Button>
      </div>
    </form>
  );
}
