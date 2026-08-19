import dayjs from "@calcom/dayjs";
import type { WorkingHours } from "@calcom/features/schedules/lib/date-ranges";

// `Availability.startTime`/`endTime` only carry a time-of-day (the date part is irrelevant), so
// their UTC hour/minute are the wall-clock hour/minute of the window - see `processWorkingHours`
// in `date-ranges.ts` for the same convention.
function minutesSinceMidnight(time: Date): number {
  return time.getUTCHours() * 60 + time.getUTCMinutes();
}

/**
 * Fixed fallback business-hours window (Mon-Fri, 9am-6pm) used until a real per-organizer
 * schedule is wired in.
 *
 * It is shaped as `WorkingHours[]` - the same type `packages/features/schedules` already uses
 * to represent a user's real availability (`Availability.days` / `startTime` / `endTime`, as
 * read from `schedule.availability`). Keeping this shape means that when business hours become
 * schedule-driven, only the *source* of this array changes (a DB-backed schedule instead of this
 * constant) - `isOutsideBusinessHours` itself needs no changes.
 */
export const DEFAULT_BUSINESS_HOURS: WorkingHours[] = [
  {
    days: [1, 2, 3, 4, 5], // Monday - Friday
    startTime: new Date(Date.UTC(2000, 0, 1, 9, 0)), // 09:00
    endTime: new Date(Date.UTC(2000, 0, 1, 18, 0)), // 18:00
  },
];

export type IsOutsideBusinessHoursParams = {
  /** Slot start time, as a UTC ISO string (e.g. a `slot.time` or booking `timeslot`). */
  date: string;
  /** Timezone the business hours window is defined in - the organizer's, per current spec. */
  timeZone: string;
  /** Event length, so a slot starting inside business hours but ending after it still warns. */
  durationInMinutes?: number;
  /**
   * Windows to check against. Defaults to a fixed Mon-Fri 9am-6pm window; pass a real schedule's
   * `availability` (already shaped as `WorkingHours[]`) to check against the organizer's actual
   * working hours instead.
   */
  businessHours?: WorkingHours[];
};

/**
 * Whether a booking slot falls outside the given business hours window(s), evaluated in
 * `timeZone`. A slot only counts as "inside" business hours if it both starts and ends within
 * the same window on the same day - a slot that starts before opening, ends after closing, or
 * spills into the next day is considered outside.
 */
export function isOutsideBusinessHours({
  date,
  timeZone,
  durationInMinutes = 0,
  businessHours = DEFAULT_BUSINESS_HOURS,
}: IsOutsideBusinessHoursParams): boolean {
  if (!businessHours.length) return false;

  const start = dayjs.utc(date).tz(timeZone);
  const end = start.add(durationInMinutes, "minute");
  const weekday = start.day();
  const startMinutes = start.hour() * 60 + start.minute();
  const endMinutes = end.hour() * 60 + end.minute();

  const fitsInsideSomeWindow = businessHours.some((window) => {
    if (!window.days.includes(weekday)) return false;
    // A slot spilling into the next calendar day can't fit within a single day's window.
    if (!end.isSame(start, "day")) return false;

    return (
      startMinutes >= minutesSinceMidnight(window.startTime) &&
      endMinutes <= minutesSinceMidnight(window.endTime)
    );
  });

  return !fitsInsideSomeWindow;
}
