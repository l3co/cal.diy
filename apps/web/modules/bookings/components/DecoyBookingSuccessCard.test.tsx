import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { showToast } from "@calcom/ui/components/toast";

import { DecoyBookingSuccessCard } from "./DecoyBookingSuccessCard";

vi.mock("@calcom/lib/hooks/useLocale", () => ({
  useLocale: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        meeting_is_scheduled: "This meeting is scheduled",
        emailed_you_and_any_other_attendees: "We sent you an email with all the details",
        what: "What",
        when: "When",
        who: "Who",
        where: "Where",
        Host: "Host",
        web_conferencing_details_to_follow: "Web conferencing details to follow.",
        copy_summary: "Copy summary",
        summary_copied: "Summary copied!",
        something_went_wrong: "Something went wrong.",
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock("@calcom/ui/components/toast", () => ({
  showToast: vi.fn(),
}));

const writeText = vi.fn().mockResolvedValue(undefined);

Object.assign(navigator, {
  clipboard: {
    writeText,
  },
});

const defaultProps = {
  title: "Quick Chat between Jane and John",
  formattedDate: "Monday, August 31, 2026",
  formattedTime: "10:00 AM",
  endTime: "10:30 AM",
  formattedTimeZone: "America/New_York",
  hostName: "Jane Doe",
  hostEmail: "jane@example.com",
  attendeeName: "John Smith",
  attendeeEmail: "john@example.com",
  location: "Google Meet",
};

describe("DecoyBookingSuccessCard - Copy summary", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders a Copy summary button", () => {
    render(<DecoyBookingSuccessCard {...defaultProps} />);

    expect(screen.getByText("Copy summary").closest("button") as HTMLButtonElement).toBeInTheDocument();
  });

  it("copies title, date, time, timezone and location to the clipboard", async () => {
    render(<DecoyBookingSuccessCard {...defaultProps} />);

    fireEvent.click(screen.getByText("Copy summary").closest("button") as HTMLButtonElement);

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));

    const copiedText = writeText.mock.calls[0][0] as string;
    expect(copiedText).toContain(defaultProps.title);
    expect(copiedText).toContain(defaultProps.formattedDate);
    expect(copiedText).toContain(defaultProps.formattedTime);
    expect(copiedText).toContain(defaultProps.endTime);
    expect(copiedText).toContain(defaultProps.formattedTimeZone);
    expect(copiedText).toContain(defaultProps.location);
  });

  it("shows a success toast after copying", async () => {
    render(<DecoyBookingSuccessCard {...defaultProps} />);

    fireEvent.click(screen.getByText("Copy summary").closest("button") as HTMLButtonElement);

    await vi.waitFor(() => expect(showToast).toHaveBeenCalledWith("Summary copied!", "success"));
  });

  it("omits the location line when no location is provided", async () => {
    render(<DecoyBookingSuccessCard {...defaultProps} location={null} />);

    fireEvent.click(screen.getByText("Copy summary").closest("button") as HTMLButtonElement);

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));

    const copiedText = writeText.mock.calls[0][0] as string;
    expect(copiedText).not.toContain("Where:");
  });
});
