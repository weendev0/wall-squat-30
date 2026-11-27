import { Attempt } from './attempt';
import { CHALLENGE_LENGTH_DAYS } from './challenge-rules.constants';
import { Challenge, dateOfDay } from './challenge';
import { LocalDate } from './local-date';

/**
 * What a challenge day looks like on the Progress grid.
 * - complete: the best attempt reached the target (BR-04)
 * - under-target: attempts exist, but none reached the target
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
}

/** Builds the 30 day results of a challenge from its attempts, as seen on `today`. */
export function buildDayResults(
  challenge: Challenge,
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
  challenge: Challenge,
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
