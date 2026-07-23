"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { profileSchema } from "@/lib/validation/schemas";
import { updateProfile } from "@/features/account/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InlineAlert } from "@/components/feedback/inline-alert";
import type { Profile } from "@/types";

type ProfileInput = z.infer<typeof profileSchema>;

export function ProfileForm({ profile }: { profile: Profile }) {
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [pending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone ?? "",
      handedness: profile.handedness,
      skill_level: (profile.skill_level ?? null) as ProfileInput["skill_level"],
      date_of_birth: profile.date_of_birth ?? "",
      accessibility_notes: profile.accessibility_notes ?? "",
      marketing_email_consent: profile.marketing_email_consent,
      marketing_sms_consent: profile.marketing_sms_consent,
    },
  });

  const onSubmit = handleSubmit((values) => {
    setResult(null);
    startTransition(async () => {
      setResult(await updateProfile(values));
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pf-first">First name</Label>
          <Input id="pf-first" {...register("first_name")} />
          {errors.first_name ? (
            <p role="alert" className="text-xs text-danger">
              {errors.first_name.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-last">Last name</Label>
          <Input id="pf-last" {...register("last_name")} />
          {errors.last_name ? (
            <p role="alert" className="text-xs text-danger">
              {errors.last_name.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-email">Email</Label>
          <Input id="pf-email" value={profile.email} disabled aria-describedby="pf-email-note" />
          <p id="pf-email-note" className="text-xs text-muted-foreground">
            Contact us to change your email address.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-phone">Phone</Label>
          <Input id="pf-phone" type="tel" {...register("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-handed">Preferred handedness</Label>
          <Select id="pf-handed" {...register("handedness")}>
            <option value="">Not set</option>
            <option value="right">Right-handed</option>
            <option value="left">Left-handed</option>
            <option value="either">Either</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-skill">Skill level</Label>
          <Select id="pf-skill" {...register("skill_level")}>
            <option value="">Not set</option>
            <option value="new">Brand new</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="competitive">Competitive</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-dob">
            Birthday <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="pf-dob" type="date" {...register("date_of_birth")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pf-access">
          Accessibility notes{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="pf-access"
          rows={2}
          placeholder="Anything we should have ready for your visits"
          {...register("accessibility_notes")}
        />
      </div>

      <fieldset className="space-y-2.5">
        <legend className="text-sm font-medium text-charcoal">Communication</legend>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal-muted">
          <Checkbox
            checked={watch("marketing_email_consent")}
            onCheckedChange={(v) => setValue("marketing_email_consent", Boolean(v))}
          />
          Email me news, events and offers
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal-muted">
          <Checkbox
            checked={watch("marketing_sms_consent")}
            onCheckedChange={(v) => setValue("marketing_sms_consent", Boolean(v))}
          />
          Text me time-sensitive updates (reminders, openings)
        </label>
        <p className="text-xs text-muted-foreground">
          Booking confirmations and receipts are always sent regardless of these
          settings.
        </p>
      </fieldset>

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
          "Save Changes"
        )}
      </Button>
    </form>
  );
}
