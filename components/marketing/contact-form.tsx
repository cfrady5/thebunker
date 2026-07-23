"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { contactSchema } from "@/lib/validation/schemas";
import { submitContact } from "@/features/contact/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InlineAlert } from "@/components/feedback/inline-alert";

type ContactInput = z.infer<typeof contactSchema>;

export function ContactForm({ defaultSubject }: { defaultSubject?: string }) {
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [pending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { subject: defaultSubject ?? "", company: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setResult(null);
    startTransition(async () => {
      const res = await submitContact(values);
      setResult(res);
      if (res.ok) reset();
    });
  });

  if (result?.ok) {
    return (
      <InlineAlert variant="success" title="Message sent!">
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
        <div className="space-y-1.5">
          <Label htmlFor="ct-name">Your name</Label>
          <Input id="ct-name" autoComplete="name" {...register("name")} />
          {errors.name ? (
            <p role="alert" className="text-xs text-danger">
              {errors.name.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ct-email">Email</Label>
          <Input id="ct-email" type="email" autoComplete="email" {...register("email")} />
          {errors.email ? (
            <p role="alert" className="text-xs text-danger">
              {errors.email.message}
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ct-subject">Subject</Label>
        <Input id="ct-subject" {...register("subject")} />
        {errors.subject ? (
          <p role="alert" className="text-xs text-danger">
            {errors.subject.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ct-message">Message</Label>
        <Textarea id="ct-message" rows={5} {...register("message")} />
        {errors.message ? (
          <p role="alert" className="text-xs text-danger">
            {errors.message.message}
          </p>
        ) : null}
      </div>

      {result && !result.ok ? (
        <InlineAlert variant="error">{result.message}</InlineAlert>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <>
            <Loader2 aria-hidden className="animate-spin" /> Sending…
          </>
        ) : (
          "Send Message"
        )}
      </Button>
    </form>
  );
}
