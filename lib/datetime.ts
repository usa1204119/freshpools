/**
 * Formats a stored UTC Date as the "YYYY-MM-DDTHH:mm" string that
 * `<input type="datetime-local">` expects, rendered in IST.
 *
 * The counterpart lives in `lib/validations` (`istDateTime`), which appends
 * +05:30 on the way back in. Both halves must agree or event times drift by
 * 5.5 hours between local and production.
 */
const IST_OFFSET_MINUTES = 5.5 * 60;

export function toIstInput(date: Date | null | undefined): string | undefined {
  if (!date) return undefined;
  const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * 60_000);
  return shifted.toISOString().slice(0, 16);
}
