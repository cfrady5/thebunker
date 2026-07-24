"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
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

type Step = "select" | "details" | "review";

const DURATIONS: Array<{ minutes: number; label: string }> = [
  { minutes: 30, label: "30m" },
  { minutes: 60, label: "60m" },
  { minutes: 90, label: "90m" },
  { minutes: 120, label: "2 hr" },
];

const DOW_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const INCLUDED = [
  "Premium simulator & HD projection",
  "Comfortable lounge seating",
  "Food & beverage service",
  "Up to 6 golfers per bay",
  "Climate-controlled clubhouse",
];

interface HoldState {
  id: string;
  expiresAtIso: string;
}

interface HoursEntry {
  days: string;
  range: string;
}

/* ---------- date helpers (local, no timezone drift) ---------- */
function ymd(d: Date): string {
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD in local zone
}
function parseYmd(s: string): Date {
  const [y = 1970, m = 1, d = 1] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}
function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 12);
}

const SPRING = { type: "spring" as const, stiffness: 420, damping: 34 };

export function BookingFlow({
  signedIn,
  userEmail,
  taxRate,
  cancellationHours,
  maxPlayers,
  advanceWindowDays,
  hours,
  locationLabel,
  cancelled,
}: {
  signedIn: boolean;
  userEmail: string | null;
  taxRate: number;
  cancellationHours: number;
  maxPlayers: number;
  advanceWindowDays: number;
  hours: HoursEntry[] | null;
  locationLabel: string;
  cancelled: boolean;
}) {
  const reduce = useReducedMotion();

  const [step, setStep] = React.useState<Step>("select");
  const [date, setDate] = React.useState<string>("");
  const [viewMonth, setViewMonth] = React.useState<Date>(() => startOfMonth(new Date()));
  const [duration, setDuration] = React.useState<number>(60);
  const [players, setPlayers] = React.useState<number>(2);
  const [times, setTimes] = React.useState<AvailableTime[] | null>(null);
  const [timesError, setTimesError] = React.useState<string | null>(null);
  const [loadingTimes, setLoadingTimes] = React.useState(false);
  const [nextLoading, setNextLoading] = React.useState(false);
  const [selectedTime, setSelectedTime] = React.useState<AvailableTime | null>(null);
  const [hold, setHold] = React.useState<HoldState | null>(null);
  const [holdError, setHoldError] = React.useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null);
  const [committing, setCommitting] = React.useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = React.useState(false);

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

  const todayStr = ymd(new Date());
  const maxStr = ymd(addDays(new Date(), advanceWindowDays));

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
        setStep("select");
        if (date) void findTimes(date);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hold]);

  async function findTimes(
    targetDate: string,
    targetDuration = duration,
    targetPlayers = players,
  ) {
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

  function pickDate(value: string) {
    setDate(value);
    setViewMonth(startOfMonth(parseYmd(value)));
    void findTimes(value);
  }

  function quickToday() {
    pickDate(ymd(new Date()));
  }
  function quickTomorrow() {
    pickDate(ymd(addDays(new Date(), 1)));
  }
  function quickWeekend() {
    const now = new Date();
    const add = (6 - now.getDay() + 7) % 7; // next Saturday (0 if today is Sat)
    pickDate(ymd(addDays(now, add)));
  }
  async function quickNextAvailable() {
    setNextLoading(true);
    setSelectedTime(null);
    const start = new Date();
    const horizon = Math.min(advanceWindowDays, 21);
    for (let i = 0; i <= horizon; i++) {
      const d = addDays(start, i);
      const ds = ymd(d);
      const res = await getAvailability({
        date: ds,
        duration_minutes: duration,
        player_count: players,
      });
      if (res.ok && res.times.length > 0) {
        setDate(ds);
        setViewMonth(startOfMonth(d));
        setTimes(res.times);
        setTimesError(null);
        setNextLoading(false);
        return;
      }
    }
    setDate(ymd(start));
    setViewMonth(startOfMonth(start));
    setTimes([]);
    setTimesError(
      "No open bays in the next few weeks. Try a longer horizon or contact us.",
    );
    setNextLoading(false);
  }

  function chooseTime(t: AvailableTime) {
    setHoldError(null);
    setSelectedTime(t);
  }

  async function continueFromSelect() {
    if (!selectedTime) return;
    setHoldError(null);
    setCommitting(true);
    const res = await createHold({
      bay_id: selectedTime.bayId,
      starts_at: selectedTime.startsAtIso,
      duration_minutes: duration,
    });
    setCommitting(false);
    if (!res.ok || !res.hold) {
      setSelectedTime(null);
      setHoldError(res.message);
      void findTimes(date);
      return;
    }
    setHold({ id: res.hold.id, expiresAtIso: res.hold.expiresAtIso });
    setMobileSummaryOpen(false);
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

  const ctaLabel =
    step === "select"
      ? "Continue"
      : step === "details"
        ? "Review reservation"
        : `Continue to Payment · ${formatCents(total)}`;
  const ctaDisabled =
    (step === "select" && (!selectedTime || committing)) ||
    (step === "review" && checkoutPending);
  const ctaBusy =
    (step === "select" && committing) || (step === "review" && checkoutPending);

  function runCta() {
    if (step === "select") return void continueFromSelect();
    if (step === "details") return setStep("review");
    return void submitCheckout();
  }

  const cta = (
    <Button
      onClick={runCta}
      size="lg"
      disabled={ctaDisabled}
      className="w-full"
    >
      {ctaBusy ? (
        <>
          <Loader2 aria-hidden className="animate-spin" />{" "}
          {step === "review" ? "Preparing payment…" : "Holding your bay…"}
        </>
      ) : (
        <>
          {step === "review" ? <CreditCard aria-hidden /> : null}
          {ctaLabel}
          {step !== "review" ? <ArrowRight aria-hidden /> : null}
        </>
      )}
    </Button>
  );

  /* ---------- experience panel (left rail) ---------- */
  const experiencePanel = (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="overflow-hidden rounded-2xl border border-primary-dark/40 bg-primary-dark text-cream shadow-card">
        <div className="relative h-52 w-full sm:h-60">
          <Image
            src="/gallery/sunset-swing.jpg"
            alt="A golfer mid-swing at golden hour"
            fill
            sizes="(max-width: 1024px) 100vw, 460px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary-dark/40 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              The Bunker Indoor Golf
            </p>
            <p className="mt-1 font-serif text-2xl font-semibold leading-tight text-cream">
              Your bay is waiting.
            </p>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <p className="text-[15px] leading-relaxed text-cream/80">
            Reserve a private simulator bay for practice, a full round or an
            evening with friends — food, drinks and comfortable seating included.
          </p>

          <div className="flex items-center justify-between border-y border-cream/10 py-3.5">
            <span
              className="flex items-center gap-0.5 text-gold"
              aria-label="Five star experience"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} aria-hidden className="h-4 w-4 fill-current" />
              ))}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-cream/70">
              <MapPin aria-hidden className="h-4 w-4 text-gold" /> {locationLabel}
            </span>
          </div>

          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
              <Clock aria-hidden className="h-3.5 w-3.5" /> Open Hours
            </p>
            <dl className="mt-3 space-y-1.5 text-sm">
              {hours && hours.length > 0 ? (
                hours.map((h) => (
                  <div key={h.days} className="flex justify-between gap-4">
                    <dt className="text-cream/60">{h.days}</dt>
                    <dd className="text-cream/90">{h.range}</dd>
                  </div>
                ))
              ) : (
                <div className="text-cream/70">Hours announced soon.</div>
              )}
            </dl>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
              Included with every reservation
            </p>
            <ul className="mt-3 space-y-2.5">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-cream/85">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20">
                    <Check aria-hidden className="h-3 w-3 text-gold" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );

  /* ---------- summary rail ---------- */
  const summaryBody = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-primary">
          Your reservation
        </h2>
        {hold && secondsLeft !== null ? (
          <span
            role="status"
            aria-live="polite"
            className="flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold-dark"
          >
            <Clock aria-hidden className="h-3.5 w-3.5" />
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
          </span>
        ) : null}
      </div>

      <dl className="space-y-2.5 text-sm">
        <SummaryRow
          label="Date"
          value={date ? formatPlainDate(date, "EEE, MMM d") : "—"}
        />
        <SummaryRow
          label="Time"
          value={selectedTime ? selectedTime.label : "Select a time"}
          muted={!selectedTime}
        />
        <SummaryRow label="Session" value={formatDuration(duration)} />
        <SummaryRow
          label="Players"
          value={`${players} ${players === 1 ? "player" : "players"}`}
        />
        <SummaryRow
          label="Bay"
          value={selectedTime ? selectedTime.bayName : "Best available"}
          muted={!selectedTime}
        />
      </dl>

      <div className="rounded-lg bg-cream/70 p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
          Included
        </p>
        <ul className="mt-2 grid grid-cols-1 gap-1.5">
          {["Simulator", "Lounge seating", "Food & drink service"].map((i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-charcoal-muted">
              <Check aria-hidden className="h-3.5 w-3.5 text-success" /> {i}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border/50 pt-4">
        <div className="flex items-center justify-between text-sm text-charcoal-muted">
          <span>Bay time</span>
          <span>{formatCents(subtotal)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm text-charcoal-muted">
          <span>Tax</span>
          <span>{formatCents(tax)}</span>
        </div>
        <div className="mt-2.5 flex items-end justify-between">
          <span className="font-serif text-base font-semibold text-charcoal">Total</span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={total}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="font-serif text-2xl font-semibold text-primary"
            >
              {formatCents(total)}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {cta}

      <ul className="space-y-1.5">
        {[
          { icon: ShieldCheck, text: "Secure checkout powered by Square" },
          { icon: Sparkles, text: "Instant email confirmation" },
          { icon: Clock, text: `Free cancellation up to ${cancellationHours} hours before` },
        ].map((t) => (
          <li key={t.text} className="flex items-center gap-2 text-xs text-charcoal-muted">
            <t.icon aria-hidden className="h-3.5 w-3.5 text-primary/70" /> {t.text}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-28 pt-8 md:px-8 md:pb-16 md:pt-12 xl:px-12">
      <header className="mb-8 md:mb-10">
        <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-gold-dark">
          Reservations
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-primary md:text-5xl">
          Book a Bay
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-charcoal-muted">
          Pick a date and time, choose your session, and we&apos;ll have your bay
          ready. Reservations confirm instantly.
        </p>
        {cancelled ? (
          <div className="mt-5 max-w-2xl">
            <InlineAlert variant="info" title="Payment cancelled">
              No worries — your card wasn&apos;t charged and no reservation was made.
              Pick up right where you left off.
            </InlineAlert>
          </div>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.36fr)_minmax(0,0.64fr)] xl:gap-10">
        {experiencePanel}

        {/* Booking interface */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.21, 0.65, 0.36, 1] }}
              >
                {step === "select" ? (
                  <SelectStep
                    reduce={Boolean(reduce)}
                    date={date}
                    viewMonth={viewMonth}
                    setViewMonth={setViewMonth}
                    onPickDate={pickDate}
                    todayStr={todayStr}
                    maxStr={maxStr}
                    duration={duration}
                    onDuration={(m) => {
                      setDuration(m);
                      if (date) void findTimes(date, m);
                    }}
                    players={players}
                    maxPlayers={maxPlayers}
                    onPlayers={(p) => {
                      setPlayers(p);
                      if (date) void findTimes(date, duration, p);
                    }}
                    times={times}
                    loadingTimes={loadingTimes}
                    timesError={timesError}
                    selectedTime={selectedTime}
                    onChooseTime={chooseTime}
                    holdError={holdError}
                    onQuick={{
                      today: quickToday,
                      tomorrow: quickTomorrow,
                      weekend: quickWeekend,
                      next: quickNextAvailable,
                    }}
                    nextLoading={nextLoading}
                  />
                ) : null}

                {step === "details" && selectedTime ? (
                  <DetailsStep
                    date={date}
                    selectedTime={selectedTime}
                    duration={duration}
                    players={players}
                    bringingClubs={bringingClubs}
                    setBringingClubs={setBringingClubs}
                    clubRental={clubRental}
                    setClubRental={setClubRental}
                    firstTime={firstTime}
                    setFirstTime={setFirstTime}
                    skill={skill}
                    setSkill={setSkill}
                    accessibility={accessibility}
                    setAccessibility={setAccessibility}
                    notes={notes}
                    setNotes={setNotes}
                    onBack={() => setStep("select")}
                  />
                ) : null}

                {step === "review" && selectedTime ? (
                  <ReviewStep
                    signedIn={signedIn}
                    userEmail={userEmail}
                    guestEmail={guestEmail}
                    setGuestEmail={setGuestEmail}
                    policyAck={policyAck}
                    setPolicyAck={setPolicyAck}
                    cancellationHours={cancellationHours}
                    checkoutError={checkoutError}
                    onBack={() => setStep("details")}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Desktop sticky summary */}
          <div className="hidden xl:block xl:sticky xl:top-24">
            <div className="rounded-2xl border border-border/50 bg-surface p-6 shadow-card">
              {summaryBody}
            </div>
          </div>

          {/* Tablet/inline summary (lg but < xl) */}
          <div className="hidden lg:block xl:hidden">
            <div className="rounded-2xl border border-border/50 bg-surface p-6 shadow-card">
              {summaryBody}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky action bar + collapsible summary */}
      <div className="fixed inset-x-0 bottom-0 z-30 lg:hidden">
        <AnimatePresence>
          {mobileSummaryOpen ? (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: 20 }}
              transition={{ duration: 0.22 }}
              className="mx-3 mb-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-border/50 bg-surface p-5 shadow-card-hover"
            >
              {summaryBody}
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div className="border-t border-border/40 bg-surface/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2.5 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSummaryOpen((v) => !v)}
              className="flex flex-col text-left"
              aria-expanded={mobileSummaryOpen}
            >
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {selectedTime ? "Total" : "Select a time"}
              </span>
              <span className="font-serif text-lg font-semibold text-primary">
                {selectedTime ? formatCents(total) : "—"}
              </span>
            </button>
            <div className="flex-1">{cta}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   Sub-components
   ===================================================================== */

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-charcoal-muted">{label}</dt>
      <dd className={cn("font-medium", muted ? "text-muted-foreground" : "text-charcoal")}>
        {value}
      </dd>
    </div>
  );
}

function StepHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  return (
    <div className="mb-5">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-charcoal-muted transition-colors hover:text-primary"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" /> Back
        </button>
      ) : null}
      <h2 className="font-serif text-2xl font-semibold text-primary">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-charcoal-muted">{subtitle}</p> : null}
    </div>
  );
}

/* ---------- Step 1: select ---------- */
function SelectStep({
  reduce,
  date,
  viewMonth,
  setViewMonth,
  onPickDate,
  todayStr,
  maxStr,
  duration,
  onDuration,
  players,
  maxPlayers,
  onPlayers,
  times,
  loadingTimes,
  timesError,
  selectedTime,
  onChooseTime,
  holdError,
  onQuick,
  nextLoading,
}: {
  reduce: boolean;
  date: string;
  viewMonth: Date;
  setViewMonth: (d: Date) => void;
  onPickDate: (v: string) => void;
  todayStr: string;
  maxStr: string;
  duration: number;
  onDuration: (m: number) => void;
  players: number;
  maxPlayers: number;
  onPlayers: (p: number) => void;
  times: AvailableTime[] | null;
  loadingTimes: boolean;
  timesError: string | null;
  selectedTime: AvailableTime | null;
  onChooseTime: (t: AvailableTime) => void;
  holdError: string | null;
  onQuick: {
    today: () => void;
    tomorrow: () => void;
    weekend: () => void;
    next: () => void;
  };
  nextLoading: boolean;
}) {
  return (
    <div className="space-y-8">
      {holdError ? <InlineAlert variant="warning">{holdError}</InlineAlert> : null}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl font-semibold text-primary">Choose a date</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Today", fn: onQuick.today },
              { label: "Tomorrow", fn: onQuick.tomorrow },
              { label: "Weekend", fn: onQuick.weekend },
            ].map((q) => (
              <QuickButton key={q.label} label={q.label} onClick={q.fn} />
            ))}
            <QuickButton
              label="Next available"
              icon={Zap}
              onClick={onQuick.next}
              loading={nextLoading}
              highlight
            />
          </div>
        </div>
        <MonthCalendar
          reduce={reduce}
          value={date}
          viewMonth={viewMonth}
          setViewMonth={setViewMonth}
          onPick={onPickDate}
          minStr={todayStr}
          maxStr={maxStr}
        />
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-2.5 text-sm font-semibold text-charcoal">Session length</p>
          <SegmentedDuration
            reduce={reduce}
            value={duration}
            onChange={onDuration}
          />
        </div>
        <div>
          <p className="mb-2.5 text-sm font-semibold text-charcoal">Players</p>
          <PlayerChips
            reduce={reduce}
            value={players}
            max={maxPlayers}
            onChange={onPlayers}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Price is per bay — split it however you like.
          </p>
        </div>
      </section>

      <section aria-live="polite">
        <p className="mb-3 text-sm font-semibold text-charcoal">
          {date ? `Available start times · ${formatPlainDate(date, "EEEE, MMMM d")}` : "Available start times"}
        </p>
        {!date ? (
          <EmptyTimes text="Pick a date above to see open bays." />
        ) : loadingTimes ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[86px] rounded-xl" />
            ))}
          </div>
        ) : times && times.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {times.map((t) => {
              const active =
                selectedTime?.startsAtIso === t.startsAtIso &&
                selectedTime?.bayId === t.bayId;
              return (
                <motion.button
                  key={`${t.startsAtIso}-${t.bayId}`}
                  type="button"
                  onClick={() => onChooseTime(t)}
                  aria-pressed={active}
                  whileHover={reduce ? undefined : { y: -3 }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  transition={SPRING}
                  className={cn(
                    "flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    active
                      ? "border-gold bg-primary text-cream shadow-card-hover"
                      : "border-border/60 bg-surface hover:border-primary/50 hover:bg-primary/[0.03]",
                  )}
                >
                  <span
                    className={cn(
                      "font-serif text-lg font-semibold",
                      active ? "text-cream" : "text-primary",
                    )}
                  >
                    {t.label}
                  </span>
                  {t.peakLabel ? (
                    <span
                      className={cn(
                        "mt-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        active
                          ? "text-gold"
                          : t.peakLabel === "peak"
                            ? "text-warning"
                            : "text-success",
                      )}
                    >
                      {t.peakLabel === "peak" ? "Peak" : "Off-peak"}
                    </span>
                  ) : (
                    <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-transparent">
                      —
                    </span>
                  )}
                  <span
                    className={cn(
                      "mt-1.5 text-sm font-medium",
                      active ? "text-cream/90" : "text-charcoal-muted",
                    )}
                  >
                    {formatCents(t.priceCents)}
                  </span>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <InlineAlert variant="info" title="No openings match those selections">
            {timesError ?? "We don't have an opening that matches those selections."}{" "}
            Try another date, shorten the session, or{" "}
            <Link
              href="/contact"
              className="font-medium text-primary underline underline-offset-2"
            >
              contact The Bunker
            </Link>
            .
          </InlineAlert>
        )}
      </section>
    </div>
  );
}

function EmptyTimes({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-border/60 bg-surface-muted px-4 py-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function QuickButton({
  label,
  onClick,
  icon: Icon,
  loading,
  highlight,
}: {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  loading?: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-70",
        highlight
          ? "border-gold/50 bg-gold/10 text-gold-dark hover:bg-gold/20"
          : "border-border/60 bg-surface text-charcoal-muted hover:border-primary/40 hover:text-primary",
      )}
    >
      {loading ? (
        <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
      ) : Icon ? (
        <Icon aria-hidden className="h-3.5 w-3.5" />
      ) : null}
      {label}
    </button>
  );
}

/* ---------- Calendar ---------- */
function MonthCalendar({
  reduce,
  value,
  viewMonth,
  setViewMonth,
  onPick,
  minStr,
  maxStr,
}: {
  reduce: boolean;
  value: string;
  viewMonth: Date;
  setViewMonth: (d: Date) => void;
  onPick: (v: string) => void;
  minStr: string;
  maxStr: string;
}) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const first = new Date(year, month, 1, 12);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<Date | null> = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d, 12));

  const canPrev = ymd(new Date(year, month, 1, 12)) > minStr.slice(0, 7) + "-01";
  const canNext = `${year}-${String(month + 1).padStart(2, "0")}` < maxStr.slice(0, 7);

  return (
    <div className="rounded-2xl border border-border/50 bg-surface p-4 shadow-card sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth(new Date(year, month - 1, 1, 12))}
          disabled={!canPrev}
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal-muted transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-30"
        >
          <ChevronLeft aria-hidden className="h-5 w-5" />
        </button>
        <p className="font-serif text-lg font-semibold text-primary">
          {MONTHS[month]} {year}
        </p>
        <button
          type="button"
          onClick={() => setViewMonth(new Date(year, month + 1, 1, 12))}
          disabled={!canNext}
          aria-label="Next month"
          className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal-muted transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-30"
        >
          <ChevronRight aria-hidden className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {DOW_SHORT.map((d, i) => (
          <div
            key={i}
            className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`b-${i}`} />;
          const ds = ymd(cell);
          const disabled = ds < minStr || ds > maxStr;
          const selected = ds === value;
          const isToday = ds === minStr;
          return (
            <button
              key={ds}
              type="button"
              disabled={disabled}
              onClick={() => onPick(ds)}
              aria-pressed={selected}
              aria-label={formatPlainDate(ds, "EEEE, MMMM d")}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                disabled && "cursor-not-allowed text-muted-foreground/30",
                !disabled && !selected && "text-charcoal hover:bg-primary/5 hover:text-primary",
                selected && "text-cream",
              )}
            >
              {selected ? (
                <motion.span
                  layoutId={reduce ? undefined : "cal-selected"}
                  transition={SPRING}
                  className="absolute inset-0.5 -z-0 rounded-lg bg-primary shadow-card"
                />
              ) : null}
              <span className="relative z-10">{cell.getDate()}</span>
              {isToday && !selected ? (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Segmented duration control ---------- */
function SegmentedDuration({
  reduce,
  value,
  onChange,
}: {
  reduce: boolean;
  value: number;
  onChange: (m: number) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Session length"
      className="grid grid-cols-4 gap-1 rounded-xl border border-border/60 bg-surface-muted p-1"
    >
      {DURATIONS.map((d) => {
        const active = value === d.minutes;
        return (
          <button
            key={d.minutes}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(d.minutes)}
            className={cn(
              "relative rounded-lg py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              active ? "text-cream" : "text-charcoal-muted hover:text-primary",
              active && reduce && "bg-primary",
            )}
          >
            {active && !reduce ? (
              <motion.span
                layoutId="dur-pill"
                transition={SPRING}
                className="absolute inset-0 -z-0 rounded-lg bg-primary shadow-card"
              />
            ) : null}
            <span className="relative z-10">{d.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Player chips ---------- */
function PlayerChips({
  reduce,
  value,
  max,
  onChange,
}: {
  reduce: boolean;
  value: number;
  max: number;
  onChange: (p: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
        const active = value === n;
        return (
          <motion.button
            key={n}
            type="button"
            aria-pressed={active}
            aria-label={`${n} ${n === 1 ? "player" : "players"}`}
            onClick={() => onChange(n)}
            whileTap={reduce ? undefined : { scale: 0.92 }}
            transition={SPRING}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              active
                ? "border-gold bg-primary text-cream shadow-card"
                : "border-border/60 bg-surface text-charcoal-muted hover:border-primary/50 hover:text-primary",
            )}
          >
            {n}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ---------- Step 2: details ---------- */
function DetailsStep({
  date,
  selectedTime,
  duration,
  players,
  bringingClubs,
  setBringingClubs,
  clubRental,
  setClubRental,
  firstTime,
  setFirstTime,
  skill,
  setSkill,
  accessibility,
  setAccessibility,
  notes,
  setNotes,
  onBack,
}: {
  date: string;
  selectedTime: AvailableTime;
  duration: number;
  players: number;
  bringingClubs: boolean;
  setBringingClubs: (v: boolean) => void;
  clubRental: boolean;
  setClubRental: (v: boolean) => void;
  firstTime: boolean;
  setFirstTime: (v: boolean) => void;
  skill: string;
  setSkill: (v: string) => void;
  accessibility: string;
  setAccessibility: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <StepHeader
        title="Session details"
        subtitle={`${formatPlainDate(date, "EEEE, MMMM d")} · ${selectedTime.label} · ${formatDuration(
          duration,
        )} · ${players} ${players === 1 ? "player" : "players"}`}
        onBack={onBack}
      />

      <div className="space-y-6 rounded-2xl border border-border/50 bg-surface p-6 shadow-card">
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-charcoal">Equipment</legend>
          <CheckRow checked={bringingClubs} onChange={setBringingClubs}>
            We&apos;re bringing our own clubs
          </CheckRow>
          <CheckRow checked={clubRental} onChange={setClubRental}>
            We&apos;ll need rental clubs (free — including left-handed &amp; junior)
          </CheckRow>
          <CheckRow checked={firstTime} onChange={setFirstTime}>
            First time on a simulator — help us get set up
          </CheckRow>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bk-skill">
              Skill level{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Select id="bk-skill" value={skill} onChange={(e) => setSkill(e.target.value)}>
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
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal-muted">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} />
      {children}
    </label>
  );
}

/* ---------- Step 3: review ---------- */
function ReviewStep({
  signedIn,
  userEmail,
  guestEmail,
  setGuestEmail,
  policyAck,
  setPolicyAck,
  cancellationHours,
  checkoutError,
  onBack,
}: {
  signedIn: boolean;
  userEmail: string | null;
  guestEmail: string;
  setGuestEmail: (v: string) => void;
  policyAck: boolean;
  setPolicyAck: (v: boolean) => void;
  cancellationHours: number;
  checkoutError: string | null;
  onBack: () => void;
}) {
  return (
    <div>
      <StepHeader
        title="Almost there"
        subtitle="Review your details, then continue to secure payment."
        onBack={onBack}
      />

      <div className="space-y-5 rounded-2xl border border-border/50 bg-surface p-6 shadow-card">
        {!signedIn ? (
          <div>
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
          <p className="text-sm text-charcoal-muted">
            Confirmation will be sent to <strong>{userEmail}</strong>.
          </p>
        )}

        <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed text-charcoal-muted">
          <Checkbox
            checked={policyAck}
            onCheckedChange={(v) => setPolicyAck(Boolean(v))}
          />
          <span>
            I understand I can cancel for a full refund until {cancellationHours} hours
            before my session, per the{" "}
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

        {checkoutError ? <InlineAlert variant="error">{checkoutError}</InlineAlert> : null}

        <p className="flex items-center gap-2 rounded-lg bg-cream/60 px-3.5 py-3 text-xs text-charcoal-muted">
          <ShieldCheck aria-hidden className="h-4 w-4 shrink-0 text-primary/70" />
          Secure checkout by Square — pay with a card, Apple Pay or Google Pay. You&apos;ll
          confirm the amount on the next screen.
        </p>
      </div>
    </div>
  );
}
