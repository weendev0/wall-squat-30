import {
  CHALLENGE_LENGTH_DAYS,
  MAX_TARGET_SECONDS,
  MIN_TARGET_SECONDS,
} from './challenge-rules.constants';
import { DomainError } from './domain-error';
import { addDays, assertLocalDate, daysBetween, LocalDate } from './local-date';

export type ChallengeStatus = 'active' | 'completed';

/** One 30-day challenge. Only one can be active at a time. */
export interface Challenge {
  readonly id: string;
  /** BR-01: Day 1 is the day the user pressed Start challenge. */
  readonly startDate: LocalDate;
  /** BR-02: fixed for the whole challenge. */
  readonly targetSeconds: number;
  readonly status: ChallengeStatus;
  /** Set when the challenge ends after day 30 (BR-10). */
  readonly completedOn: LocalDate | null;
  /** BR-10: the celebration screen is shown only once. */
  readonly celebrationShown: boolean;
}

export interface NewChallengeInput {
  readonly id: string;
  readonly startDate: LocalDate;
  readonly targetSeconds: number;
}

/** BR-01 and BR-02: creates a new active challenge after checking the input. */
export function createChallenge(input: NewChallengeInput): Challenge {
  assertLocalDate(input.startDate);
  assertValidTarget(input.targetSeconds);

  return {
    id: input.id,
    startDate: input.startDate,
    targetSeconds: input.targetSeconds,
    status: 'active',
    completedOn: null,
    celebrationShown: false,
  };
}

/** BR-02: a target must be whole seconds between the minimum and maximum. */
export function assertValidTarget(targetSeconds: number): void {
  const isInRange = targetSeconds >= MIN_TARGET_SECONDS && targetSeconds <= MAX_TARGET_SECONDS;
  if (!Number.isInteger(targetSeconds) || !isInRange) {
    throw new DomainError(
      `The target must be between ${MIN_TARGET_SECONDS} and ${MAX_TARGET_SECONDS} seconds.`,
    );
  }
}

/** The calendar date of a challenge day (day 1 = startDate). */
export function dateOfDay(challenge: Challenge, dayNumber: number): LocalDate {
  assertValidDayNumber(dayNumber);
  return addDays(challenge.startDate, dayNumber - 1);
}

/**
 * BR-01: which challenge day `date` is, or null when it falls before
 * day 1 or after day 30.
 */
export function dayNumberOn(challenge: Challenge, date: LocalDate): number | null {
  const dayNumber = daysBetween(challenge.startDate, date) + 1;
  const isInsideChallenge = dayNumber >= 1 && dayNumber <= CHALLENGE_LENGTH_DAYS;
  return isInsideChallenge ? dayNumber : null;
}

/** BR-10: the challenge is over once day 30 has passed. */
export function hasChallengeEnded(challenge: Challenge, today: LocalDate): boolean {
  return daysBetween(challenge.startDate, today) >= CHALLENGE_LENGTH_DAYS;
}

/** BR-10: marks the challenge as finished; it then moves to history. */
export function completeChallenge(challenge: Challenge, today: LocalDate): Challenge {
  if (!hasChallengeEnded(challenge, today)) {
    throw new DomainError('A challenge can only be completed after day 30.');
  }
  return { ...challenge, status: 'completed', completedOn: today };
}

/** BR-10: remembers that the celebration was shown, so it never shows twice. */
export function markCelebrationShown(challenge: Challenge): Challenge {
  return { ...challenge, celebrationShown: true };
}

export function assertValidDayNumber(dayNumber: number): void {
  const isInRange = dayNumber >= 1 && dayNumber <= CHALLENGE_LENGTH_DAYS;
  if (!Number.isInteger(dayNumber) || !isInRange) {
    throw new DomainError(`Day must be between 1 and ${CHALLENGE_LENGTH_DAYS}.`);
  }
}
