import { MAX_ATTEMPT_SECONDS, MIN_ATTEMPT_SECONDS } from './challenge-rules.constants';
import { Challenge, dateOfDay, dayNumberOn } from './challenge';
import { DomainError } from './domain-error';
import { assertLocalDate, LocalDate } from './local-date';

/** How the attempt was recorded: with the timer, or typed in by hand (BR-08). */
export type AttemptSource = 'timer' | 'manual';

export type Feeling = 'easy' | 'solid' | 'tough' | 'none';

/** One wall squat hold. A day can have many attempts (BR-03). */
export interface Attempt {
  readonly id: string;
  readonly challengeId: string;
  /** The challenge day this attempt counts for (1 to 30). */
  readonly dayNumber: number;
  /** The day the attempt was saved. Later than the day itself means a make-up (BR-07). */
  readonly recordedOn: LocalDate;
  readonly durationSeconds: number;
  readonly source: AttemptSource;
  /** BR-07: saved on a later date than the day it counts for. */
  readonly isMakeUp: boolean;
  readonly feeling: Feeling;
  readonly note: string;
}

export interface NewAttemptInput {
  readonly id: string;
  readonly challenge: Challenge;
  readonly dayNumber: number;
  readonly recordedOn: LocalDate;
  readonly durationSeconds: number;
  readonly source: AttemptSource;
  readonly feeling?: Feeling;
  readonly note?: string;
}

/**
 * BR-05: very short holds are thrown away without asking the user.
 * Anything at or above the minimum gets a Save or Discard choice.
 */
export function isTooShortToKeep(durationSeconds: number): boolean {
  return durationSeconds < MIN_ATTEMPT_SECONDS;
}

/**
 * Creates an attempt after checking the business rules:
 * - BR-05: at least the minimum length
 * - BR-07: an attempt for an earlier day is a make-up
 * - an attempt can never be for a day in the future
 */
export function createAttempt(input: NewAttemptInput): Attempt {
  assertLocalDate(input.recordedOn);
  assertValidDuration(input.durationSeconds);

  const dayDate = dateOfDay(input.challenge, input.dayNumber);
  const todayNumber = dayNumberOn(input.challenge, input.recordedOn);
  const isFutureDay = dayDate > input.recordedOn;
  if (isFutureDay || todayNumber === null) {
    throw new DomainError('You can only add attempts for today or earlier challenge days.');
  }

  return {
    id: input.id,
    challengeId: input.challenge.id,
    dayNumber: input.dayNumber,
    recordedOn: input.recordedOn,
    durationSeconds: input.durationSeconds,
    source: input.source,
    isMakeUp: dayDate < input.recordedOn,
    feeling: input.feeling ?? 'none',
    note: (input.note ?? '').trim(),
  };
}

function assertValidDuration(durationSeconds: number): void {
  if (!Number.isInteger(durationSeconds)) {
    throw new DomainError('The time must be whole seconds.');
  }
  if (isTooShortToKeep(durationSeconds)) {
    throw new DomainError(`Attempts under ${MIN_ATTEMPT_SECONDS} seconds are not saved.`);
  }
  if (durationSeconds > MAX_ATTEMPT_SECONDS) {
    throw new DomainError('That time looks too long. Please check the minutes.');
  }
}
