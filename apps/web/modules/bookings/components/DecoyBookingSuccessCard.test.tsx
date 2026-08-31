import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { showToast } from "@calcom/ui/components/toast";

import { DecoyBookingSuccessCard } from "./DecoyBookingSuccessCard";

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

vi.mock("@calcom/lib/hooks/useLocale", () => ({
  useLocale: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

vi.mock("@calcom/ui/components/toast", () => ({
  showToast: vi.fn(),
}));

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

/** The button lives inside an `aria-hidden` decorative wrapper (a pre-existing
 *  quirk of this modal-styled card), so accessible-role queries can't see it.
 *  Query by its visible text instead, matching how a sighted user finds it. */
const getCopyButton = () => screen.getByText("Copy summary").closest("button") as HTMLButtonElement;

describe("DecoyBookingSuccessCard - Copy summary", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders a Copy summary button", () => {
      render(<DecoyBookingSuccessCard {...defaultProps} />);

      expect(getCopyButton()).toBeInTheDocument();
    });

    it("renders the button even when optional fields (host, attendee, location) are missing", () => {
      render(
        <DecoyBookingSuccessCard
          {...defaultProps}
          hostName={null}
          hostEmail={null}
          attendeeName={null}
          attendeeEmail={null}
          location={null}
        />
      );

      expect(getCopyButton()).toBeInTheDocument();
    });

    it("exposes an empty, polite live region before anything is copied", () => {
      const { container } = render(<DecoyBookingSuccessCard {...defaultProps} />);

      const liveRegion = container.querySelector('[role="status"]');
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
      expect(liveRegion).toHaveTextContent("");
    });
  });

  describe("copying to the clipboard", () => {
    it("copies title, date, time, timezone and location", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      render(<DecoyBookingSuccessCard {...defaultProps} />);
      fireEvent.click(getCopyButton());

      await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));

      const copiedText = writeText.mock.calls[0][0] as string;
      expect(copiedText).toBe(
        [
          "What: Quick Chat between Jane and John",
          "When: Monday, August 31, 2026, 10:00 AM - 10:30 AM (America/New_York)",
          "Where: Google Meet",
        ].join("\n")
      );
    });

    it("omits the Where line when there is no location", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      render(<DecoyBookingSuccessCard {...defaultProps} location={null} />);
      fireEvent.click(getCopyButton());

      await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));

      const copiedText = writeText.mock.calls[0][0] as string;
      expect(copiedText).not.toContain("Where:");
    });

    it("never copies host or attendee details", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      render(<DecoyBookingSuccessCard {...defaultProps} />);
      fireEvent.click(getCopyButton());

      await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));

      const copiedText = writeText.mock.calls[0][0] as string;
      expect(copiedText).not.toContain(defaultProps.hostName);
      expect(copiedText).not.toContain(defaultProps.hostEmail);
      expect(copiedText).not.toContain(defaultProps.attendeeName);
      expect(copiedText).not.toContain(defaultProps.attendeeEmail);
    });
  });

  describe("feedback", () => {
    it("shows a success toast and updates the live region after copying", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      const { container } = render(<DecoyBookingSuccessCard {...defaultProps} />);
      fireEvent.click(getCopyButton());

      await waitFor(() => expect(showToast).toHaveBeenCalledWith("Summary copied!", "success"));
      expect(container.querySelector('[role="status"]')).toHaveTextContent("Summary copied!");
    });

    it("swaps the button icon to the checked state once copied", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      render(<DecoyBookingSuccessCard {...defaultProps} />);
      fireEvent.click(getCopyButton());

      await waitFor(() => expect(getCopyButton().querySelector("use")).toHaveAttribute("href", "#clipboard-check"));
    });

    it("shows an error toast when the clipboard write rejects", async () => {
      const writeText = vi.fn().mockRejectedValue(new Error("denied"));
      Object.assign(navigator, { clipboard: { writeText } });
      // useCopy() logs the failure via console.error; keep the test output clean.
      vi.spyOn(console, "error").mockImplementation(() => undefined);

      render(<DecoyBookingSuccessCard {...defaultProps} />);
      fireEvent.click(getCopyButton());

      await waitFor(() =>
        expect(showToast).toHaveBeenCalledWith("Something went wrong.", "error")
      );
    });

    it("does not show a success toast when the clipboard write rejects", async () => {
      const writeText = vi.fn().mockRejectedValue(new Error("denied"));
      Object.assign(navigator, { clipboard: { writeText } });
      vi.spyOn(console, "error").mockImplementation(() => undefined);

      render(<DecoyBookingSuccessCard {...defaultProps} />);
      fireEvent.click(getCopyButton());

      await waitFor(() => expect(showToast).toHaveBeenCalled());
      expect(showToast).not.toHaveBeenCalledWith("Summary copied!", "success");
    });
  });
});
