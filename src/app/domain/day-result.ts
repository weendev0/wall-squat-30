import { Attempt } from './attempt';
import { CHALLENGE_LENGTH_DAYS } from './challenge-rules.constants';
import { Challenge, CheckOffChallenge, dateOfDay, TimedChallenge } from './challenge';
import { CheckIn } from './check-in';
import { LocalDate } from './local-date';

/**
 * What a challenge day looks like on the Progress grid.
 * - complete: the best attempt reached the target (BR-04), or Done was tapped (BR-14)
 * - under-target: attempts exist, but none reached the target (timed challenges only)
 * - missed: a past day with no attempts
 * - pending: today, nothing recorded yet
 * - upcoming: a day still to come
 */
export type DayStatus = 'complete' | 'under-target' | 'missed' | 'pending' | 'upcoming';

/** The summary of one challenge day. Always calculated, never stored. */
export interface DayResult {
  readonly dayNumber: number;
  readonly date: LocalDate;
  readonly status: DayStatus;
  /** BR-03: the best attempt of the day counts. null when there is no attempt. */
  readonly bestSeconds: number | null;
  /** The target was reached on the day itself, so the day counts for the streak (BR-06). */
  readonly completedOnTime: boolean;
  /** BR-07: the target was only reached by a later make-up attempt. Shown with its own icon. */
  readonly completedByMakeUp: boolean;
  /** BR-08: at least one attempt was added by hand. Shown with a pencil icon. */
  readonly hasManualAttempt: boolean;
  readonly attemptCount: number;
  /** BR-15: the day has a note. Shown with a pencil-on-paper mark on Progress. */
  readonly hasNote: boolean;
}

/** Builds the 30 day results of a timed challenge from its attempts, as seen on `today`. */
export function buildDayResults(
  challenge: TimedChallenge,
  attempts: readonly Attempt[],
  today: LocalDate,
): DayResult[] {
  const results: DayResult[] = [];
  for (let dayNumber = 1; dayNumber <= CHALLENGE_LENGTH_DAYS; dayNumber++) {
    const attemptsOfDay = attempts.filter(
      (attempt) => attempt.challengeId === challenge.id && attempt.dayNumber === dayNumber,
    );
    results.push(buildDayResult(challenge, dayNumber, attemptsOfDay, today));
  }
  return results;
}

function buildDayResult(
  challenge: TimedChallenge,
  dayNumber: number,
  attemptsOfDay: readonly Attempt[],
  today: LocalDate,
): DayResult {
  const date = dateOfDay(challenge, dayNumber);
  const target = challenge.targetSeconds;
  const reachesTarget = (attempt: Attempt) => attempt.durationSeconds >= target;

  const bestSeconds = bestDuration(attemptsOfDay);
  const completedOnTime = attemptsOfDay.some((a) => !a.isMakeUp && reachesTarget(a));
  const completedByMakeUp =
    !completedOnTime && attemptsOfDay.some((a) => a.isMakeUp && reachesTarget(a));

  return {
    dayNumber,
    date,
    status: statusOf(date, today, bestSeconds, target),
    bestSeconds,
    completedOnTime,
    completedByMakeUp,
    hasManualAttempt: attemptsOfDay.some((attempt) => attempt.source === 'manual'),
    attemptCount: attemptsOfDay.length,
    hasNote: attemptsOfDay.some((attempt) => attempt.note !== ''),
  };
}

/**
 * Builds the 30 day results of a check-off challenge from its check-ins (BR-14).
 * The result has the same shape as a timed day, so streaks, make-ups and the
 * Progress grid work the same way for both kinds (BR-17, BR-18).
 */
export function buildCheckOffDayResults(
  challenge: CheckOffChallenge,
  checkIns: readonly CheckIn[],
  today: LocalDate,
): DayResult[] {
  const results: DayResult[] = [];
  for (let dayNumber = 1; dayNumber <= CHALLENGE_LENGTH_DAYS; dayNumber++) {
    const checkIn = checkIns.find(
      (item) => item.challengeId === challenge.id && item.dayNumber === dayNumber,
    );
    results.push(buildCheckOffDayResult(challenge, dayNumber, checkIn, today));
  }
  return results;
}

function buildCheckOffDayResult(
  challenge: Challenge,
  dayNumber: number,
  checkIn: CheckIn | undefined,
  today: LocalDate,
): DayResult {
  const date = dateOfDay(challenge, dayNumber);
  return {
    dayNumber,
    date,
    status: checkIn ? 'complete' : statusWithoutRecord(date, today),
    bestSeconds: null,
    completedOnTime: checkIn !== undefined && !checkIn.isMakeUp,
    completedByMakeUp: checkIn?.isMakeUp ?? false,
    hasManualAttempt: false,
    attemptCount: 0,
    hasNote: (checkIn?.note ?? '') !== '',
  };
}

function statusOf(
  date: LocalDate,
  today: LocalDate,
  bestSeconds: number | null,
  targetSeconds: number,
): DayStatus {
  if (bestSeconds !== null) {
    return bestSeconds >= targetSeconds ? 'complete' : 'under-target';
  }
  return statusWithoutRecord(date, today);
}

/** A day with nothing recorded: still to come, today, or missed. */
function statusWithoutRecord(date: LocalDate, today: LocalDate): DayStatus {
  if (date > today) {
    return 'upcoming';
  }
  return date === today ? 'pending' : 'missed';
}

function bestDuration(attempts: readonly Attempt[]): number | null {
  if (attempts.length === 0) {
    return null;
  }
  return Math.max(...attempts.map((attempt) => attempt.durationSeconds));
}
