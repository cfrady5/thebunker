import { format } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

export const FACILITY_TIMEZONE =
  process.env.NEXT_PUBLIC_FACILITY_TIMEZONE ?? "America/Indiana/Indianapolis";

/** Formats an ISO timestamp in the facility's local time. */
export function formatFacility(dateIso: string | Date, pattern: string): string {
  return formatInTimeZone(dateIso, FACILITY_TIMEZONE, pattern);
}

export function formatDateLong(dateIso: string | Date): string {
  return formatFacility(dateIso, "EEEE, MMMM d, yyyy");
}

export function formatTime(dateIso: string | Date): string {
  return formatFacility(dateIso, "h:mm a");
}

export function formatDateTime(dateIso: string | Date): string {
  return formatFacility(dateIso, "EEE, MMM d · h:mm a");
}

/**
 * Converts a facility-local date (YYYY-MM-DD) and time (HH:mm)
 * into a UTC Date. Used when building availability windows.
 */
export function facilityLocalToUtc(date: string, time: string): Date {
  return fromZonedTime(`${date}T${time}`, FACILITY_TIMEZONE);
}

/** Returns the facility-local day of week (0=Sunday) for a date string. */
export function facilityDayOfWeek(date: string): number {
  const utc = facilityLocalToUtc(date, "12:00");
  return toZonedTime(utc, FACILITY_TIMEZONE).getDay();
}

/** Today's date (YYYY-MM-DD) in facility time. */
export function facilityToday(now: Date = new Date()): string {
  return formatInTimeZone(now, FACILITY_TIMEZONE, "yyyy-MM-dd");
}

/** Local date key for a UTC instant, e.g. grouping bookings by day. */
export function facilityDateKey(dateIso: string | Date): string {
  return formatFacility(dateIso, "yyyy-MM-dd");
}

/** Simple local format for date inputs etc. (no timezone conversion). */
export function formatPlainDate(date: string, pattern = "EEEE, MMMM d"): string {
  return format(new Date(`${date}T12:00:00`), pattern);
}
