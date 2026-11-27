import { Attempt, AttemptSource, createAttempt } from '../attempt';
import {
  CheckOffCategory,
  CheckOffChallenge,
  createCheckOffChallenge,
  createTimedChallenge,
  dateOfDay,
  TimedChallenge,
} from '../challenge';
import { CheckIn, createCheckIn } from '../check-in';
import { LocalDate } from '../local-date';

/** Test helpers that build valid domain objects with sensible defaults. */

export const START_DATE: LocalDate = '2026-11-16';

export function aChallenge(
  overrides: Partial<{ startDate: LocalDate; targetSeconds: number }> = {},
): TimedChallenge {
  return createTimedChallenge({
    id: 'challenge-1',
    startDate: overrides.startDate ?? START_DATE,
    targetSeconds: overrides.targetSeconds ?? 60,
  });
}

let attemptCounter = 0;

/**
 * An attempt for `dayNumber`. By default it is recorded on that same day (not a make-up).
 * Pass `recordedOnDay` to record it later, which makes it a make-up.
 */
export function anAttempt(
  challenge: TimedChallenge,
  dayNumber: number,
  durationSeconds: number,
  options: { recordedOnDay?: number; source?: AttemptSource } = {},
): Attempt {
  attemptCounter++;
  return createAttempt({
    id: `attempt-${attemptCounter}`,
    challenge,
    dayNumber,
    recordedOn: dateOfDay(challenge, options.recordedOnDay ?? dayNumber),
    durationSeconds,
    source: options.source ?? 'timer',
  });
}

/** A Reading challenge called "Atomic Habits", starting on START_DATE unless told otherwise. */
export function aCheckOffChallenge(
  overrides: Partial<{ startDate: LocalDate; category: CheckOffCategory }> = {},
): CheckOffChallenge {
  return createCheckOffChallenge({
    id: 'reading-1',
    startDate: overrides.startDate ?? START_DATE,
    name: 'Atomic Habits',
    category: overrides.category ?? 'reading',
  });
}

let checkInCounter = 0;

/**
 * The Done of `dayNumber`. By default it is tapped on that same day (not a make-up).
 * Pass `recordedOnDay` to tap it later, which makes it a make-up.
 */
export function aCheckIn(
  challenge: CheckOffChallenge,
  dayNumber: number,
  options: { recordedOnDay?: number; note?: string } = {},
): CheckIn {
  checkInCounter++;
  return createCheckIn({
    id: `check-in-${checkInCounter}`,
    challenge,
    dayNumber,
    recordedOn: dateOfDay(challenge, options.recordedOnDay ?? dayNumber),
    note: options.note,
  });
}
