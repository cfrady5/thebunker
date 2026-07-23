"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type SignupInput,
} from "@/lib/validation/schemas";
import { z } from "zod";
import {
  requestPasswordReset,
  signIn,
  signUp,
  updatePassword,
  type AuthResult,
} from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { InlineAlert } from "@/components/feedback/inline-alert";

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 aria-hidden className="animate-spin" /> One moment…
        </>
      ) : (
        label
      )}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-danger">
      {message}
    </p>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [result, setResult] = React.useState<AuthResult | null>(null);
  const [pending, startTransition] = React.useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit((values) => {
    setResult(null);
    startTransition(async () => {
      const res = await signIn({ ...values, next });
      // On success signIn redirects; a result only comes back on failure.
      setResult(res);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary hover:text-gold-dark"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>
      {result && !result.ok ? (
        <InlineAlert variant="error">{result.message}</InlineAlert>
      ) : null}
      <SubmitButton pending={pending} label="Sign In" />
    </form>
  );
}

export function SignupForm() {
  const [result, setResult] = React.useState<AuthResult | null>(null);
  const [pending, startTransition] = React.useTransition();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { marketing_email_consent: false },
  });

  const onSubmit = handleSubmit((values) => {
    setResult(null);
    startTransition(async () => {
      setResult(await signUp(values));
    });
  });

  if (result?.ok) {
    return (
      <InlineAlert variant="success" title="Check your email">
        {result.message}
      </InlineAlert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="su-first">First name</Label>
          <Input
            id="su-first"
            autoComplete="given-name"
            aria-invalid={Boolean(errors.first_name)}
            {...register("first_name")}
          />
          <FieldError message={errors.first_name?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="su-last">Last name</Label>
          <Input
            id="su-last"
            autoComplete="family-name"
            aria-invalid={Boolean(errors.last_name)}
            {...register("last_name")}
          />
          <FieldError message={errors.last_name?.message} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-email">Email</Label>
        <Input
          id="su-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-password">Password</Label>
        <Input
          id="su-password"
          type="password"
          autoComplete="new-password"
          aria-describedby="su-password-hint"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        <p id="su-password-hint" className="text-xs text-muted-foreground">
          At least 10 characters with a letter and a number.
        </p>
        <FieldError message={errors.password?.message} />
      </div>
      <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-charcoal-muted">
        <Checkbox
          checked={watch("marketing_email_consent")}
          onCheckedChange={(v) => setValue("marketing_email_consent", Boolean(v))}
        />
        <span>
          Email me news, events and opening updates from The Bunker. Optional —
          unsubscribe anytime.
        </span>
      </label>
      {result && !result.ok ? (
        <InlineAlert variant="error">{result.message}</InlineAlert>
      ) : null}
      <SubmitButton pending={pending} label="Create Account" />
      <p className="text-center text-xs text-muted-foreground">
        By creating an account you agree to our{" "}
        <Link href="/policies/terms" className="font-medium text-primary underline underline-offset-2">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/policies/privacy" className="font-medium text-primary underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [result, setResult] = React.useState<AuthResult | null>(null);
  const [pending, startTransition] = React.useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = handleSubmit((values) => {
    setResult(null);
    startTransition(async () => {
      setResult(await requestPasswordReset(values));
    });
  });

  if (result?.ok) {
    return <InlineAlert variant="success">{result.message}</InlineAlert>;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="fp-email">Email</Label>
        <Input
          id="fp-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>
      {result && !result.ok ? (
        <InlineAlert variant="error">{result.message}</InlineAlert>
      ) : null}
      <SubmitButton pending={pending} label="Send Reset Link" />
    </form>
  );
}

export function ResetPasswordForm() {
  const [result, setResult] = React.useState<AuthResult | null>(null);
  const [pending, startTransition] = React.useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = handleSubmit((values) => {
    setResult(null);
    startTransition(async () => {
      setResult(await updatePassword(values));
    });
  });

  if (result?.ok) {
    return (
      <div className="space-y-4">
        <InlineAlert variant="success">{result.message}</InlineAlert>
        <Button asChild className="w-full">
          <Link href="/account">Go to My Account</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="rp-password">New password</Label>
        <Input
          id="rp-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rp-confirm">Confirm new password</Label>
        <Input
          id="rp-confirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirm)}
          {...register("confirm")}
        />
        <FieldError message={errors.confirm?.message} />
      </div>
      {result && !result.ok ? (
        <InlineAlert variant="error">{result.message}</InlineAlert>
      ) : null}
      <SubmitButton pending={pending} label="Update Password" />
    </form>
  );
}
