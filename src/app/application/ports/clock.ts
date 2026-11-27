import { LocalDate } from '../../domain';

/**
 * Tells the time. Use cases never call `new Date()` themselves,
 * so tests can pretend it is any day (for example day 30, or just after midnight).
 */
export interface Clock {
  /** Today's calendar date on the phone. */
  today(): LocalDate;
}
