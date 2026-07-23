"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  Flag,
  GraduationCap,
  Loader2,
  PartyPopper,
  Trophy,
  Users,
} from "lucide-react";
import { getAvailability, type AvailableTime } from "@/features/bookings/availability";
import { createHold, startCheckout } from "@/features/bookings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCents, formatDuration, cn } from "@/lib/utils";
import { formatPlainDate } from "@/lib/dates";

type Step = "experience" | "date-time" | "details" | "review";

const STEPS: Array<{ id: Step; label: string }> = [
  { id: "experience", label: "Experience" },
  { id: "date-time", label: "Date & time" },
  { id: "details", label: "Details" },
  { id: "review", label: "Review & pay" },
];

const DURATIONS = [30, 60, 90, 120];

interface HoldState {
  id: string;
  expiresAtIso: string;
}

export function BookingFlow({
  signedIn,
  userEmail,
  taxRate,
  cancellationHours,
  maxPlayers,
}: {
  signedIn: boolean;
  userEmail: string | null;
  taxRate: number;
  cancellationHours: number;
  maxPlayers: number;
}) {
  const [step, setStep] = React.useState<Step>("experience");
  const [date, setDate] = React.useState<string>("");
  const [duration, setDuration] = React.useState<number>(60);
  const [players, setPlayers] = React.useState<number>(2);
  const [times, setTimes] = React.useState<AvailableTime[] | null>(null);
  const [timesError, setTimesError] = React.useState<string | null>(null);
  const [loadingTimes, setLoadingTimes] = React.useState(false);
  const [selectedTime, setSelectedTime] = React.useState<AvailableTime | null>(null);
  const [hold, setHold] = React.useState<HoldState | null>(null);
  const [holdError, setHoldError] = React.useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null);

  // Details
  const [bringingClubs, setBringingClubs] = React.useState(true);
  const [clubRental, setClubRental] = React.useState(false);
  const [firstTime, setFirstTime] = React.useState(false);
  const [skill, setSkill] = React.useState<string>("");
  const [accessibility, setAccessibility] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // Review
  const [guestEmail, setGuestEmail] = React.useState("");
  const [policyAck, setPolicyAck] = React.useState(false);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);
  const [checkoutPending, setCheckoutPending] = React.useState(false);

  // Hold countdown
  React.useEffect(() => {
    if (!hold) {
      setSecondsLeft(null);
      return;
    }
    const tick = () => {
      const left = Math.max(
        0,
        Math.floor((new Date(hold.expiresAtIso).getTime() - Date.now()) / 1000),
      );
      setSecondsLeft(left);
      if (left === 0) {
        setHold(null);
        setSelectedTime(null);
        setHoldError(
          "Your held time expired. Please pick a time again — no charge was made.",
        );
        setStep("date-time");
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [hold]);

  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local
  const shortcuts = React.useMemo(() => {
    const mk = (offset: number, label: string) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      return { label, value: d.toLocaleDateString("en-CA") };
    };
    const out = [mk(0, "Today"), mk(1, "Tomorrow")];
    const d = new Date();
    for (let i = 2; i < 8; i++) {
      const t = new Date(d);
      t.setDate(d.getDate() + i);
      if (t.getDay() === 6) out.push({ label: "Saturday", value: t.toLocaleDateString("en-CA") });
      if (t.getDay() === 0) out.push({ label: "Sunday", value: t.toLocaleDateString("en-CA") });
    }
    return out;
  }, []);

  async function findTimes(targetDate: string, targetDuration = duration, targetPlayers = players) {
    if (!targetDate) return;
    setLoadingTimes(true);
    setTimes(null);
    setTimesError(null);
    setSelectedTime(null);
    const res = await getAvailability({
      date: targetDate,
      duration_minutes: targetDuration,
      player_count: targetPlayers,
    });
    setLoadingTimes(false);
    if (res.ok) {
      setTimes(res.times);
    } else {
      setTimesError(res.message);
      setTimes([]);
    }
  }

  async function selectTime(time: AvailableTime) {
    setHoldError(null);
    setSelectedTime(time);
    const res = await createHold({
      bay_id: time.bayId,
      starts_at: time.startsAtIso,
      duration_minutes: duration,
    });
    if (!res.ok || !res.hold) {
      setSelectedTime(null);
      setHoldError(res.message);
      void findTimes(date);
      return;
    }
    setHold({ id: res.hold.id, expiresAtIso: res.hold.expiresAtIso });
    setStep("details");
  }

  async function submitCheckout() {
    if (!hold || !selectedTime) return;
    setCheckoutError(null);
    if (!policyAck) {
      setCheckoutError("Please acknowledge the cancellation policy to continue.");
      return;
    }
    if (!signedIn && !/.+@.+\..+/.test(guestEmail)) {
      setCheckoutError("Enter a valid email so we can send your confirmation.");
      return;
    }
    setCheckoutPending(true);
    const res = await startCheckout({
      hold_id: hold.id,
      details: {
        player_count: players,
        skill_level: (skill || undefined) as
          | "new"
          | "beginner"
          | "intermediate"
          | "advanced"
          | undefined,
        bringing_clubs: bringingClubs,
        club_rental_required: clubRental,
        first_time: firstTime,
        accessibility_needs: accessibility || undefined,
        notes: notes || undefined,
      },
      guest_email: signedIn ? undefined : guestEmail,
    });
    if (res.ok && res.checkoutUrl) {
      window.location.assign(res.checkoutUrl);
      return;
    }
    setCheckoutPending(false);
    setCheckoutError(res.message);
  }

  const subtotal = selectedTime?.priceCents ?? 0;
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress */}
      <ol className="flex items-center gap-2" aria-label="Booking progress">
        {STEPS.map((s, i) => (
          <li key={s.id} className="flex flex-1 flex-col gap-1.5">
            <span
              aria-hidden
              className={cn(
                "h-1.5 rounded-full",
                i <= stepIndex ? "bg-gold" : "bg-border/50",
              )}
            />
            <span
              className={cn(
                "text-xs font-medium",
                i === stepIndex ? "text-primary" : "text-muted-foreground",
              )}
              aria-current={i === stepIndex ? "step" : undefined}
            >
              {s.label}
            </span>
          </li>
        ))}
      </ol>

      {/* Hold timer */}
      {hold && secondsLeft !== null && step !== "experience" ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 flex items-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-4 py-2.5 text-sm font-medium text-gold-dark"
        >
          <Clock aria-hidden className="h-4 w-4" />
          Your time is held for {Math.floor(secondsLeft / 60)}:
          {String(secondsLeft % 60).padStart(2, "0")}
        </div>
      ) : null}

      <div className="mt-6">
        {/* STEP 1 — EXPERIENCE */}
        {step === "experience" ? (
          <div>
            <h2 className="font-serif text-2xl font-semibold text-primary">
              What brings you in?
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setStep("date-time")}
                className="rounded-lg border-2 border-primary bg-primary/5 p-5 text-left transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <Flag aria-hidden className="h-6 w-6 text-primary" />
                <p className="mt-3 font-serif text-lg font-semibold text-primary">
                  Book a Simulator Bay
                </p>
                <p className="mt-1 text-sm text-charcoal-muted">
                  Practice, play a course or hang out with friends. Up to {maxPlayers}{" "}
                  players per bay. From 30 minutes.
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Choose date &amp; time <ArrowRight aria-hidden className="h-4 w-4" />
                </span>
              </button>

              {[
                {
                  icon: GraduationCap,
                  title: "Lessons",
                  body: "Private instruction and clinics with our teaching team.",
                  href: "/lessons",
                },
                {
                  icon: Trophy,
                  title: "Leagues & tournaments",
                  body: "Weekly leagues and one-day events for all levels.",
                  href: "/leagues",
                },
                {
                  icon: PartyPopper,
                  title: "Private events",
                  body: "Birthdays, business outings and group rentals.",
                  href: "/private-events",
                },
              ].map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="rounded-lg border border-border/50 bg-surface p-5 transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <card.icon aria-hidden className="h-6 w-6 text-gold-dark" />
                  <p className="mt-3 font-serif text-lg font-semibold text-primary">
                    {card.title}
                  </p>
                  <p className="mt-1 text-sm text-charcoal-muted">{card.body}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {/* STEP 2 — DATE & TIME */}
        {step === "date-time" ? (
          <div>
            <h2 className="font-serif text-2xl font-semibold text-primary">
              Choose your time
            </h2>

            {holdError ? (
              <div className="mt-4">
                <InlineAlert variant="warning">{holdError}</InlineAlert>
              </div>
            ) : null}

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="bk-date">Date</Label>
                <Input
                  id="bk-date"
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    void findTimes(e.target.value);
                  }}
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {shortcuts.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => {
                        setDate(s.value);
                        void findTimes(s.value);
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                        date === s.value
                          ? "border-primary bg-primary text-cream"
                          : "border-border/60 bg-surface text-charcoal-muted hover:border-primary/40",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bk-players">Players</Label>
                <Select
                  id="bk-players"
                  value={String(players)}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    setPlayers(p);
                    if (date) void findTimes(date, duration, p);
                  }}
                >
                  {Array.from({ length: maxPlayers }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "player" : "players"}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-muted-foreground">
                  Price is per bay — split it however you like.
                </p>
              </div>
            </div>

            <fieldset className="mt-5">
              <legend className="text-sm font-medium text-charcoal">Session length</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={duration === d}
                    onClick={() => {
                      setDuration(d);
                      if (date) void findTimes(date, d);
                    }}
                    className={cn(
                      "rounded-md border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                      duration === d
                        ? "border-primary bg-primary text-cream"
                        : "border-border/60 bg-surface text-charcoal-muted hover:border-primary/40",
                    )}
                  >
                    {formatDuration(d)}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                For most groups, one hour works well for practice or a short round.
                Larger groups may prefer 90–120 minutes.
              </p>
            </fieldset>

            <div className="mt-6" aria-live="polite">
              {loadingTimes ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : times === null ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays aria-hidden className="h-4 w-4" /> Pick a date to see
                  available times.
                </p>
              ) : times.length === 0 ? (
                <InlineAlert variant="info" title="No openings match those selections">
                  {timesError ??
                    "We don't have an opening that matches those selections."}{" "}
                  Try another date, shorten the session, or{" "}
                  <Link href="/contact" className="font-medium text-primary underline underline-offset-2">
                    contact The Bunker
                  </Link>
                  .
                </InlineAlert>
              ) : (
                <>
                  <h3 className="text-sm font-medium text-charcoal">
                    Available start times — {formatPlainDate(date)}
                  </h3>
                  <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {times.map((t) => (
                      <button
                        key={`${t.startsAtIso}-${t.bayId}`}
                        type="button"
                        onClick={() => void selectTime(t)}
                        disabled={Boolean(selectedTime)}
                        className="flex flex-col items-center rounded-md border border-border/60 bg-surface px-2 py-2.5 transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
                      >
                        <span className="text-sm font-semibold text-primary">
                          {t.label}
                        </span>
                        <span className="text-xs text-charcoal-muted">
                          {formatCents(t.priceCents)}
                        </span>
                        {t.peakLabel ? (
                          <span
                            className={cn(
                              "mt-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              t.peakLabel === "peak" ? "text-warning" : "text-success",
                            )}
                          >
                            {t.peakLabel}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mt-8">
              <Button variant="ghost" onClick={() => setStep("experience")}>
                <ArrowLeft aria-hidden /> Back
              </Button>
            </div>
          </div>
        ) : null}

        {/* STEP 3 — DETAILS */}
        {step === "details" && selectedTime ? (
          <div>
            <h2 className="font-serif text-2xl font-semibold text-primary">
              Session details
            </h2>
            <p className="mt-1 text-sm text-charcoal-muted">
              {formatPlainDate(date, "EEEE, MMMM d")} · {selectedTime.label} ·{" "}
              {formatDuration(duration)} · {players} {players === 1 ? "player" : "players"}
            </p>

            <div className="mt-6 space-y-5">
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-charcoal">Equipment</legend>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal-muted">
                  <Checkbox
                    checked={bringingClubs}
                    onCheckedChange={(v) => setBringingClubs(Boolean(v))}
                  />
                  We&apos;re bringing our own clubs
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal-muted">
                  <Checkbox
                    checked={clubRental}
                    onCheckedChange={(v) => setClubRental(Boolean(v))}
                  />
                  We&apos;ll need rental clubs (free — including left-handed &amp; junior)
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal-muted">
                  <Checkbox
                    checked={firstTime}
                    onCheckedChange={(v) => setFirstTime(Boolean(v))}
                  />
                  First time on a simulator — help us get set up
                </label>
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="bk-skill">
                    Skill level{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Select
                    id="bk-skill"
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="new">Brand new to golf</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bk-access">
                    Accessibility needs{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="bk-access"
                    value={accessibility}
                    onChange={(e) => setAccessibility(e.target.value)}
                    placeholder="We'll have things ready"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bk-notes">
                  Notes for our team{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="bk-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Celebrating something? Let us know!"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => {
                  setStep("date-time");
                }}
              >
                <ArrowLeft aria-hidden /> Back
              </Button>
              <Button onClick={() => setStep("review")} size="lg">
                Review Reservation <ArrowRight aria-hidden />
              </Button>
            </div>
          </div>
        ) : null}

        {/* STEP 4 — REVIEW & PAY */}
        {step === "review" && selectedTime ? (
          <div>
            <h2 className="font-serif text-2xl font-semibold text-primary">
              Review your reservation
            </h2>

            <div className="mt-5 rounded-lg border border-border/50 bg-surface p-6">
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-charcoal-muted">Date</dt>
                  <dd className="font-medium text-charcoal">
                    {formatPlainDate(date, "EEEE, MMMM d, yyyy")}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-charcoal-muted">Time</dt>
                  <dd className="font-medium text-charcoal">
                    {selectedTime.label} · {formatDuration(duration)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-charcoal-muted">Bay</dt>
                  <dd className="font-medium text-charcoal">{selectedTime.bayName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-charcoal-muted">Players</dt>
                  <dd className="font-medium text-charcoal">
                    <Users aria-hidden className="mr-1 inline h-4 w-4" /> Up to {players}
                  </dd>
                </div>
                <div className="my-3 border-t border-border/40" role="presentation" />
                <div className="flex justify-between gap-4">
                  <dt className="text-charcoal-muted">Bay time</dt>
                  <dd className="text-charcoal">{formatCents(subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-charcoal-muted">Tax</dt>
                  <dd className="text-charcoal">{formatCents(tax)}</dd>
                </div>
                <div className="flex justify-between gap-4 text-base font-semibold">
                  <dt className="text-charcoal">Total</dt>
                  <dd className="text-primary">{formatCents(total)}</dd>
                </div>
              </dl>
            </div>

            {!signedIn ? (
              <div className="mt-5 rounded-lg border border-border/50 bg-surface p-5">
                <p className="text-sm font-medium text-charcoal">
                  Continue as guest, or{" "}
                  <Link
                    href="/login?next=/book"
                    className="font-semibold text-primary underline underline-offset-2"
                  >
                    sign in
                  </Link>{" "}
                  for faster checkout next time.
                </p>
                <div className="mt-3 space-y-1.5">
                  <Label htmlFor="bk-guest-email">Email for your confirmation</Label>
                  <Input
                    id="bk-guest-email"
                    type="email"
                    autoComplete="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm text-charcoal-muted">
                Confirmation will be sent to <strong>{userEmail}</strong>.
              </p>
            )}

            <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed text-charcoal-muted">
              <Checkbox
                checked={policyAck}
                onCheckedChange={(v) => setPolicyAck(Boolean(v))}
              />
              <span>
                I understand I can cancel for a full refund until {cancellationHours}{" "}
                hours before my session, per the{" "}
                <Link
                  href="/policies/cancellation"
                  target="_blank"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  cancellation policy
                </Link>
                .
              </span>
            </label>

            {checkoutError ? (
              <div className="mt-4">
                <InlineAlert variant="error">{checkoutError}</InlineAlert>
              </div>
            ) : null}

            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep("details")}>
                <ArrowLeft aria-hidden /> Back
              </Button>
              <Button
                onClick={() => void submitCheckout()}
                size="lg"
                disabled={checkoutPending}
              >
                {checkoutPending ? (
                  <>
                    <Loader2 aria-hidden className="animate-spin" /> Preparing payment…
                  </>
                ) : (
                  <>Continue to Payment · {formatCents(total)}</>
                )}
              </Button>
            </div>
            <p className="mt-3 text-right text-xs text-muted-foreground">
              Secure payment by Stripe — cards, Apple Pay and Google Pay.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
