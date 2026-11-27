import { DomainError } from './domain-error';

/**
 * BR-12: times are whole seconds, shown as m:ss.
 * formatDuration(74) === '1:14', formatDuration(5) === '0:05'.
 */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

/**
 * Turns minutes and seconds typed by the user into whole seconds.
 * toTotalSeconds(1, 15) === 75.
 */
export function toTotalSeconds(minutes: number, seconds: number): number {
  const isWholeNumber = Number.isInteger(minutes) && Number.isInteger(seconds);
  if (!isWholeNumber || minutes < 0 || seconds < 0 || seconds > 59) {
    throw new DomainError('Enter whole minutes and 0 to 59 seconds.');
  }
  return minutes * 60 + seconds;
}
