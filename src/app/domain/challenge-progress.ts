import { Attempt } from './attempt';
import { DayResult } from './day-result';
import { LocalDate } from './local-date';

/** The numbers shown on Today, Progress, History and Celebration. */
export interface ChallengeProgress {
  /** Days whose best attempt reached the target, make-ups included (BR-04, BR-07). */
  readonly daysComplete: number;
  /** BR-06: consecutive on-time complete days up to today. */
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly bestHoldSeconds: number | null;
  readonly totalSeconds: number;
  /** Average of every saved attempt, rounded to whole seconds. */
  readonly averageSeconds: number | null;
  /** Past days that are missed or under target, so they can still be made up (BR-07). */
  readonly daysToMakeUp: readonly number[];
}

export function calculateProgress(
  days: readonly DayResult[],
  attempts: readonly Attempt[],
  today: LocalDate,
): ChallengeProgress {
  const durations = attempts.map((attempt) => attempt.durationSeconds);
  const totalSeconds = durations.reduce((sum, seconds) => sum + seconds, 0);

  return {
    daysComplete: days.filter((day) => day.status === 'complete').length,
    currentStreak: currentStreak(days, today),
    longestStreak: longestStreak(days),
    bestHoldSeconds: durations.length > 0 ? Math.max(...durations) : null,
    totalSeconds,
    averageSeconds: durations.length > 0 ? Math.round(totalSeconds / durations.length) : null,
    daysToMakeUp: days
      .filter((day) => day.date < today && day.status !== 'complete')
      .map((day) => day.dayNumber),
  };
}

/**
 * BR-06: counts on-time complete days backwards from today.
 * Today only adds to the streak once it is done; until then it does not break it.
 * A day completed by a make-up never counts (BR-07).
 */
export function currentStreak(days: readonly DayResult[], today: LocalDate): number {
  const pastAndToday = days.filter((day) => day.date <= today);
  const todayResult = pastAndToday.find((day) => day.date === today);
  const startsAfterToday = todayResult !== undefined && !todayResult.completedOnTime;
  const daysToCount = startsAfterToday ? pastAndToday.slice(0, -1) : pastAndToday;

  let streak = 0;
  for (let index = daysToCount.length - 1; index >= 0; index--) {
    if (!daysToCount[index].completedOnTime) {
      break;
    }
    streak++;
  }
  return streak;
}

/** The longest run of on-time complete days anywhere in the challenge. */
export function longestStreak(days: readonly DayResult[]): number {
  let longest = 0;
  let running = 0;
  for (const day of days) {
    running = day.completedOnTime ? running + 1 : 0;
    longest = Math.max(longest, running);
  }
  return longest;
}

/** True when `durationSeconds` beats every earlier attempt in every challenge. */
export function isPersonalBest(
  durationSeconds: number,
  earlierAttempts: readonly Attempt[],
): boolean {
  return earlierAttempts.every((attempt) => durationSeconds > attempt.durationSeconds);
}
