import type { WorkingHours } from "@calcom/features/schedules/lib/date-ranges";
import { describe, expect, it } from "vitest";
import { DEFAULT_BUSINESS_HOURS, isOutsideBusinessHours } from "./businessHours";

describe("isOutsideBusinessHours", () => {
  it("returns false for a slot inside the default Mon-Fri 9am-6pm window", () => {
    // Wednesday 2024-01-03, 10:00 UTC
    expect(
      isOutsideBusinessHours({ date: "2024-01-03T10:00:00Z", timeZone: "UTC", durationInMinutes: 30 })
    ).toBe(false);
  });

  it("returns true for a slot before opening time", () => {
    // Wednesday 2024-01-03, 08:00 UTC
    expect(isOutsideBusinessHours({ date: "2024-01-03T08:00:00Z", timeZone: "UTC" })).toBe(true);
  });

  it("returns true for a slot starting inside but ending after closing time", () => {
    // Wednesday 2024-01-03, 17:45 UTC + 60 minutes -> ends 18:45, past the 18:00 close
    expect(
      isOutsideBusinessHours({ date: "2024-01-03T17:45:00Z", timeZone: "UTC", durationInMinutes: 60 })
    ).toBe(true);
  });

  it("returns true for a slot on a weekend day", () => {
    // Saturday 2024-01-06, 10:00 UTC
    expect(isOutsideBusinessHours({ date: "2024-01-06T10:00:00Z", timeZone: "UTC" })).toBe(true);
  });

  it("evaluates the slot in the given timeZone, not in UTC", () => {
    // Wednesday 2024-01-03T10:00:00Z is 05:00 in America/New_York - before opening there.
    expect(isOutsideBusinessHours({ date: "2024-01-03T10:00:00Z", timeZone: "America/New_York" })).toBe(true);
    // ...but is 20:00 in Asia/Tokyo - after closing there.
    expect(isOutsideBusinessHours({ date: "2024-01-03T10:00:00Z", timeZone: "Asia/Tokyo" })).toBe(true);
  });

  it("returns false when no business hours are configured (feature disabled)", () => {
    expect(isOutsideBusinessHours({ date: "2024-01-06T10:00:00Z", timeZone: "UTC", businessHours: [] })).toBe(
      false
    );
  });

  it("accepts a custom set of WorkingHours windows, ready for schedule-driven business hours", () => {
    const nightShift: WorkingHours[] = [
      {
        days: [1, 2, 3, 4, 5],
        startTime: new Date(Date.UTC(2000, 0, 1, 22, 0)),
        endTime: new Date(Date.UTC(2000, 0, 1, 23, 59)),
      },
    ];
    // 22:30 UTC on a Wednesday: outside the default window, but inside this custom one.
    expect(
      isOutsideBusinessHours({ date: "2024-01-03T22:30:00Z", timeZone: "UTC", businessHours: nightShift })
    ).toBe(false);
  });

  it("exposes the default window as Mon-Fri 9am-6pm", () => {
    expect(DEFAULT_BUSINESS_HOURS).toEqual([
      {
        days: [1, 2, 3, 4, 5],
        startTime: new Date(Date.UTC(2000, 0, 1, 9, 0)),
        endTime: new Date(Date.UTC(2000, 0, 1, 18, 0)),
      },
    ]);
  });
});
