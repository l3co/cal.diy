export interface BookingSummaryLabels {
  /** Label for the "What" (title) line, e.g. t("what") */
  what: string;
  /** Label for the "When" (date/time/timezone) line, e.g. t("when") */
  when: string;
  /** Label for the "Where" (location) line, e.g. t("where") */
  where: string;
}

export interface BookingSummaryDetails {
  title: string;
  formattedDate: string;
  formattedTime: string;
  endTime: string;
  formattedTimeZone: string;
  location: string | null;
}

/**
 * Builds a plain-text, human-readable summary of a booking's title, date,
 * time, timezone and location — suitable for copying to the clipboard.
 *
 * Each line is only included when the underlying data is present, so a
 * booking missing e.g. a location produces a summary without a blank
 * "Where" line.
 *
 * @param details - The booking fields to summarize
 * @param labels - Localized labels for each line (see {@link BookingSummaryLabels})
 * @returns The formatted, newline-separated summary text
 */
export function buildBookingSummary(
  { title, formattedDate, formattedTime, endTime, formattedTimeZone, location }: BookingSummaryDetails,
  labels: BookingSummaryLabels
): string {
  const lines: string[] = [];

  lines.push(`${labels.what}: ${title}`);

  if (formattedDate) {
    let when = formattedDate;
    if (formattedTime) {
      when += `, ${formattedTime}`;
      if (endTime) {
        when += ` - ${endTime}`;
      }
      if (formattedTimeZone) {
        when += ` (${formattedTimeZone})`;
      }
    }
    lines.push(`${labels.when}: ${when}`);
  }

  if (location) {
    lines.push(`${labels.where}: ${location}`);
  }

  return lines.join("\n");
}
