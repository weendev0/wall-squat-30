import { Clock } from '../../application';
import { LocalDate, toLocalDate } from '../../domain';

/** The real clock: today's date in the phone's time zone. */
export class SystemClock implements Clock {
  today(): LocalDate {
    return toLocalDate(new Date());
  }
}
