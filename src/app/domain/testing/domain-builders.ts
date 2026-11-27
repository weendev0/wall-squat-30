import { Attempt, AttemptSource, createAttempt } from '../attempt';
import { Challenge, createChallenge, dateOfDay } from '../challenge';
import { LocalDate } from '../local-date';

/** Test helpers that build valid domain objects with sensible defaults. */

export const START_DATE: LocalDate = '2026-11-16';

export function aChallenge(
  overrides: Partial<{ startDate: LocalDate; targetSeconds: number }> = {},
): Challenge {
  return createChallenge({
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
  challenge: Challenge,
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
