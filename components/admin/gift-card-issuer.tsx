"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Gift, Plus, Copy, Check } from "lucide-react";
import { issueGiftCard } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InlineAlert } from "@/components/feedback/inline-alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type PaymentMethod = "square_link" | "cash" | "card" | "comp" | "other";

type Result = { code?: string; paymentUrl?: string; message: string };

export function GiftCardIssuer() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [method, setMethod] = React.useState<PaymentMethod>("square_link");
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<Result | null>(null);
  const [copied, setCopied] = React.useState<"code" | "link" | null>(null);

  function reset() {
    setError(null);
    setResult(null);
    setMethod("square_link");
    setCopied(null);
  }

  function close() {
    setOpen(false);
    if (result) router.refresh();
  }

  function copy(text: string, which: "code" | "link") {
    void navigator.clipboard?.writeText(text);
    setCopied(which);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const amount = Number(fd.get("amount"));
    if (!Number.isFinite(amount) || amount < 5) {
      setError("Enter an amount of at least $5.");
      return;
    }
    const input = {
      amount_cents: Math.round(amount * 100),
      assign_email: String(fd.get("assign_email") ?? "").trim(),
      recipient_name: String(fd.get("recipient_name") ?? "").trim(),
      recipient_email: String(fd.get("recipient_email") ?? "").trim(),
      personal_message: String(fd.get("personal_message") ?? "").trim(),
      delivery_date: String(fd.get("delivery_date") ?? "").trim(),
      payment_method: method,
      payment_reference: String(fd.get("payment_reference") ?? "").trim(),
    };
    startTransition(async () => {
      const res = await issueGiftCard(input);
      if (res.ok) {
        setResult({ code: res.code, paymentUrl: res.paymentUrl, message: res.message });
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        <Plus aria-hidden className="mr-1 h-4 w-4" />
        Issue gift card
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) close();
          else setOpen(true);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift aria-hidden className="h-5 w-5 text-gold" />
              Issue a gift card
            </DialogTitle>
            <DialogDescription>
              Assign it to a customer&apos;s account and take payment through Square,
              or record another payment method.
            </DialogDescription>
          </DialogHeader>

          {result ? (
            <div className="space-y-4">
              <InlineAlert variant="success">{result.message}</InlineAlert>

              {result.code ? (
                <div className="rounded-lg border border-border/50 bg-cream/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Gift card code
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="font-mono text-lg font-semibold tracking-wide text-primary">
                      {result.code}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copy(result.code!, "code")}
                    >
                      {copied === "code" ? (
                        <Check aria-hidden className="h-4 w-4" />
                      ) : (
                        <Copy aria-hidden className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    This code is shown once and isn&apos;t stored — copy it now and give
                    it to the customer.
                  </p>
                </div>
              ) : null}

              {result.paymentUrl ? (
                <div className="rounded-lg border border-border/50 bg-surface p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Square payment link
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <a
                      href={result.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm text-primary underline"
                    >
                      {result.paymentUrl}
                    </a>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copy(result.paymentUrl!, "link")}
                    >
                      {copied === "link" ? (
                        <Check aria-hidden className="h-4 w-4" />
                      ) : (
                        <Copy aria-hidden className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Send this to the customer. Once they pay, activate the card from the
                    list.
                  </p>
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset();
                  }}
                >
                  Issue another
                </Button>
                <Button type="button" onClick={close}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="gc-amount">Amount ($)</Label>
                  <Input
                    id="gc-amount"
                    name="amount"
                    type="number"
                    min="5"
                    step="0.01"
                    placeholder="50.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gc-assign">
                    Assign to account{" "}
                    <span className="font-normal text-muted-foreground">(customer email)</span>
                  </Label>
                  <Input
                    id="gc-assign"
                    name="assign_email"
                    type="email"
                    placeholder="customer@email.com"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="gc-rname">
                    Recipient name{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input id="gc-rname" name="recipient_name" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gc-remail">
                    Recipient email{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input id="gc-remail" name="recipient_email" type="email" autoComplete="off" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gc-message">
                  Personal message{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="gc-message"
                  name="personal_message"
                  className="min-h-[70px]"
                  placeholder="Happy birthday — enjoy a round on us!"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="gc-method">Payment method</Label>
                  <Select
                    id="gc-method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="square_link">Square payment link (customer pays online)</option>
                    <option value="card">Paid — card (Square terminal)</option>
                    <option value="cash">Paid — cash</option>
                    <option value="comp">Comp / promo (no charge)</option>
                    <option value="other">Paid — other</option>
                  </Select>
                </div>
                {method === "card" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="gc-ref">
                      Square payment ID{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input id="gc-ref" name="payment_reference" autoComplete="off" />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="gc-delivery">
                      Delivery date{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input id="gc-delivery" name="delivery_date" type="date" />
                  </div>
                )}
              </div>

              {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={close}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Working…" : "Issue gift card"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
