import { DomainError } from './domain-error';

/**
 * A calendar day on the user's phone, written as 'YYYY-MM-DD' (for example '2026-11-27').
 *
 * Why a string and not a Date? A Date is a moment in time, so it shifts with time zones.
 * The challenge only cares about calendar days (BR-01), and a plain string is easy to
 * store, compare ('2026-11-27' < '2026-11-28') and read in tests.
 */
export type LocalDate = string;

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** Throws a DomainError when `value` is not a real 'YYYY-MM-DD' date. */
export function assertLocalDate(value: string): void {
  const isWellFormed = LOCAL_DATE_PATTERN.test(value);
  if (!isWellFormed || toUtcMilliseconds(value) === null) {
    throw new DomainError(`"${value}" is not a valid date (expected YYYY-MM-DD).`);
  }
}

/** The calendar day of `moment` in the phone's own time zone. */
export function toLocalDate(moment: Date): LocalDate {
  const year = moment.getFullYear();
  const month = String(moment.getMonth() + 1).padStart(2, '0');
  const day = String(moment.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Moves `date` forward (or backward, with a negative number) by whole days. */
export function addDays(date: LocalDate, days: number): LocalDate {
  const start = requireUtcMilliseconds(date);
  return new Date(start + days * MILLISECONDS_PER_DAY).toISOString().slice(0, 10);
}

/** How many days `to` is after `from` (negative when `to` is earlier). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  const difference = requireUtcMilliseconds(to) - requireUtcMilliseconds(from);
  return Math.round(difference / MILLISECONDS_PER_DAY);
}

function requireUtcMilliseconds(date: LocalDate): number {
  assertLocalDate(date);
  return toUtcMilliseconds(date) as number;
}

/** Reads the date as midnight UTC, so adding days never trips over daylight saving. */
function toUtcMilliseconds(date: string): number | null {
  const [year, month, day] = date.split('-').map(Number);
  const milliseconds = Date.UTC(year, month - 1, day);
  const roundTrip = new Date(milliseconds).toISOString().slice(0, 10);
  return roundTrip === date ? milliseconds : null;
}
