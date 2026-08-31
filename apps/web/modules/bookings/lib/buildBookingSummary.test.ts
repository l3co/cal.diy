import { describe, expect, it } from "vitest";

import { buildBookingSummary } from "./buildBookingSummary";

const labels = { what: "What", when: "When", where: "Where" };

const fullDetails = {
  title: "Quick Chat between Jane and John",
  formattedDate: "Monday, August 31, 2026",
  formattedTime: "10:00 AM",
  endTime: "10:30 AM",
  formattedTimeZone: "America/New_York",
  location: "Google Meet",
};

describe("buildBookingSummary", () => {
  it("includes title, date, time, timezone and location when all are present", () => {
    const summary = buildBookingSummary(fullDetails, labels);

    expect(summary).toBe(
      [
        "What: Quick Chat between Jane and John",
        "When: Monday, August 31, 2026, 10:00 AM - 10:30 AM (America/New_York)",
        "Where: Google Meet",
      ].join("\n")
    );
  });

  it("always includes the title, even when every other field is empty", () => {
    const summary = buildBookingSummary(
      { title: "Untitled event", formattedDate: "", formattedTime: "", endTime: "", formattedTimeZone: "", location: null },
      labels
    );

    expect(summary).toBe("What: Untitled event");
  });

  it("omits the When line entirely when there is no formatted date", () => {
    const summary = buildBookingSummary({ ...fullDetails, formattedDate: "" }, labels);

    expect(summary).not.toContain("When:");
    expect(summary).toBe(["What: Quick Chat between Jane and John", "Where: Google Meet"].join("\n"));
  });

  it("shows only the date when there is no formatted time", () => {
    const summary = buildBookingSummary({ ...fullDetails, formattedTime: "" }, labels);

    expect(summary).toContain("When: Monday, August 31, 2026");
    expect(summary).not.toContain("10:00 AM");
  });

  it("omits the end time when it is not provided", () => {
    const summary = buildBookingSummary({ ...fullDetails, endTime: "" }, labels);

    expect(summary).toContain("When: Monday, August 31, 2026, 10:00 AM (America/New_York)");
    expect(summary).not.toContain(" - ");
  });

  it("omits the timezone parentheses when there is no timezone", () => {
    const summary = buildBookingSummary({ ...fullDetails, formattedTimeZone: "" }, labels);

    expect(summary).toContain("When: Monday, August 31, 2026, 10:00 AM - 10:30 AM");
    expect(summary).not.toContain("(");
  });

  it("omits the Where line when location is null", () => {
    const summary = buildBookingSummary({ ...fullDetails, location: null }, labels);

    expect(summary).not.toContain("Where:");
  });

  it("omits the Where line when location is an empty string", () => {
    const summary = buildBookingSummary({ ...fullDetails, location: "" }, labels);

    expect(summary).not.toContain("Where:");
  });

  it("produces newline-separated lines suitable for pasting into plain text", () => {
    const summary = buildBookingSummary(fullDetails, labels);

    expect(summary.split("\n")).toHaveLength(3);
  });

  it("respects localized labels", () => {
    const summary = buildBookingSummary(fullDetails, {
      what: "O quê",
      when: "Quando",
      where: "Onde",
    });

    expect(summary).toContain("O quê: Quick Chat between Jane and John");
    expect(summary).toContain("Quando: Monday, August 31, 2026");
    expect(summary).toContain("Onde: Google Meet");
  });
});
