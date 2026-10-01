import { isOutsideBusinessHours } from "@calcom/features/bookings/lib/businessHours";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Alert } from "@calcom/ui/components/alert";

type BusinessHoursWarningProps = {
  /** Slot start time, as a UTC ISO string. */
  time: string | null;
  /** Organizer's schedule timezone. No warning is shown when this isn't known yet. */
  timeZone?: string | null;
  /** Event length, so a slot starting inside but ending after business hours still warns. */
  durationInMinutes?: number | null;
  className?: string;
};

/**
 * Warns when a booking slot falls outside business hours. Currently checked against a fixed
 * Mon-Fri 9am-6pm window (see `DEFAULT_BUSINESS_HOURS` in `businessHours.ts`) - once organizers
 * can have their own schedule checked instead, only the `businessHours` argument passed to
 * `isOutsideBusinessHours` needs to change here.
 */
export const BusinessHoursWarning = ({
  time,
  timeZone,
  durationInMinutes,
  className,
}: BusinessHoursWarningProps) => {
  const { t } = useLocale();

  if (!time || !timeZone) return null;

  const outsideBusinessHours = isOutsideBusinessHours({
    date: time,
    timeZone,
    durationInMinutes: durationInMinutes ?? undefined,
  });

  if (!outsideBusinessHours) return null;

  return (
    <Alert
      data-testid="business-hours-warning"
      severity="warning"
      message={t("outside_business_hours_warning")}
      className={className}
    />
  );
};
