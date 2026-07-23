"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { householdMemberSchema } from "@/lib/validation/schemas";
import {
  addHouseholdMember,
  removeHouseholdMember,
} from "@/features/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InlineAlert } from "@/components/feedback/inline-alert";

type MemberInput = z.infer<typeof householdMemberSchema>;

export function AddHouseholdMemberDialog() {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MemberInput>({
    resolver: zodResolver(householdMemberSchema),
    defaultValues: { relationship: "child" },
  });

  const onSubmit = handleSubmit((values) => {
    setResult(null);
    startTransition(async () => {
      const res = await addHouseholdMember(values);
      setResult(res);
      if (res.ok) {
        reset();
        setOpen(false);
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus aria-hidden /> Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a household member</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="hm-first">First name</Label>
              <Input id="hm-first" {...register("first_name")} />
              {errors.first_name ? (
                <p role="alert" className="text-xs text-danger">
                  {errors.first_name.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-last">Last name</Label>
              <Input id="hm-last" {...register("last_name")} />
              {errors.last_name ? (
                <p role="alert" className="text-xs text-danger">
                  {errors.last_name.message}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="hm-rel">Relationship</Label>
              <Select id="hm-rel" {...register("relationship")}>
                <option value="child">Child</option>
                <option value="spouse">Spouse</option>
                <option value="partner">Partner</option>
                <option value="dependent">Dependent</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-dob">
                Date of birth{" "}
                <span className="font-normal text-muted-foreground">
                  (needed for youth programs)
                </span>
              </Label>
              <Input id="hm-dob" type="date" {...register("date_of_birth")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="hm-ec-name">Emergency contact</Label>
              <Input id="hm-ec-name" {...register("emergency_contact_name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-ec-phone">Emergency phone</Label>
              <Input id="hm-ec-phone" type="tel" {...register("emergency_contact_phone")} />
            </div>
          </div>
          {result && !result.ok ? (
            <InlineAlert variant="error">{result.message}</InlineAlert>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 aria-hidden className="animate-spin" /> Adding…
              </>
            ) : (
              "Add Member"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RemoveMemberButton({ memberId, name }: { memberId: string; name: string }) {
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Remove ${name} from household`}
      disabled={pending}
      onClick={() => {
        if (window.confirm(`Remove ${name} from your household?`)) {
          startTransition(async () => {
            await removeHouseholdMember(memberId);
          });
        }
      }}
    >
      {pending ? (
        <Loader2 aria-hidden className="animate-spin" />
      ) : (
        <Trash2 aria-hidden className="text-danger" />
      )}
    </Button>
  );
}
