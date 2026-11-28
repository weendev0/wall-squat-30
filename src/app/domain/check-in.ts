import { CheckOffChallenge, isMakeUpDay } from './challenge';
import { MAX_DAY_COUNT } from './challenge-rules.constants';
import { JUST_DONE_GOAL } from './check-off-category';
import { DomainError } from './domain-error';
import { LocalDate } from './local-date';
import { cleanNote } from './note';

/**
 * BR-14: the record of one day of a check-off challenge. At most one per challenge day.
 * For Just Done it means the day is done; for a counted challenge it holds how far the
 * day got, such as 3 of 8 glasses (BR-23).
 */
export interface CheckIn {
  readonly id: string;
  readonly challengeId: string;
  /** The challenge day this Done counts for (1 to 30). */
  readonly dayNumber: number;
  /**
   * The day it was done: when Done was tapped, or when the count reached the goal.
   * Later than the day itself means a make-up (BR-17).
   */
  readonly recordedOn: LocalDate;
  /** BR-17: done on a later date than the day it counts for. */
  readonly isMakeUp: boolean;
  /** BR-23: how many were counted, such as 3 glasses. Always 1 for Just Done. */
  readonly count: number;
  /** BR-15: optional thoughts for the day. Empty when there is none. */
  readonly note: string;
}

export interface NewCheckInInput {
  readonly id: string;
  readonly challenge: CheckOffChallenge;
  readonly dayNumber: number;
  readonly recordedOn: LocalDate;
  readonly note?: string;
  /** BR-23: leave out for Just Done (1). */
  readonly count?: number;
}

/**
 * Creates the Done of one day after checking the rules:
 * - a day can never be in the future (BR-14)
 * - an earlier day is a make-up (BR-17)
 * - the note is optional and trimmed (BR-15)
 * - the count is a whole number from 1 up (BR-23)
 */
export function createCheckIn(input: NewCheckInInput): CheckIn {
  const count = input.count ?? JUST_DONE_GOAL;
  assertValidCount(count);
  return {
    id: input.id,
    challengeId: input.challenge.id,
    dayNumber: input.dayNumber,
    recordedOn: input.recordedOn,
    isMakeUp: isMakeUpDay(input.challenge, input.dayNumber, input.recordedOn),
    count,
    note: cleanNote(input.note),
  };
}

/** BR-22: the day is done once the count reaches the challenge's daily goal. */
export function isCheckInDone(challenge: CheckOffChallenge, checkIn: CheckIn): boolean {
  return checkIn.count >= challenge.dailyGoal;
}

/**
 * BR-23: changes the count of a day. When this change finishes the day, the day counts
 * as done on `today`, so finishing it on a later date makes it a make-up (BR-17).
 */
export function withCount(
  challenge: CheckOffChallenge,
  checkIn: CheckIn,
  count: number,
  today: LocalDate,
): CheckIn {
  assertValidCount(count);
  const updated = { ...checkIn, count };
  const finishesTheDayNow = !isCheckInDone(challenge, checkIn) && isCheckInDone(challenge, updated);
  if (!finishesTheDayNow) {
    return updated;
  }
  return {
    ...updated,
    recordedOn: today,
    isMakeUp: isMakeUpDay(challenge, checkIn.dayNumber, today),
  };
}

function assertValidCount(count: number): void {
  if (!Number.isInteger(count) || count < 1 || count > MAX_DAY_COUNT) {
    throw new DomainError(`The count must be between 1 and ${MAX_DAY_COUNT}.`);
  }
}

/** BR-15: the note can be changed later; the rest of the check-in stays as it was. */
export function withNote(checkIn: CheckIn, note: string): CheckIn {
  return { ...checkIn, note: cleanNote(note) };
}
