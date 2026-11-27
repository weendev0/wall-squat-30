import { LocalDate } from '../../domain';

/** '2026-11-27' → 'Fri 27 Nov', in the phone's local calendar. */
export function shortDateLabel(date: LocalDate): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
