import { Attempt, AttemptSource, createAttempt } from '../attempt';
import {
  CheckOffChallenge,
  createCheckOffChallenge,
  createCustomCheckOffChallenge,
  createTimedChallenge,
  dateOfDay,
  TimedChallenge,
} from '../challenge';
import { CheckIn, createCheckIn } from '../check-in';
import {
  BuiltInCheckOffCategory,
  createCustomCheckOffCategory,
  CustomCheckOffCategory,
  CustomCheckOffCategoryFields,
} from '../check-off-category';
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
  overrides: Partial<{ startDate: LocalDate; category: BuiltInCheckOffCategory }> = {},
): CheckOffChallenge {
  return createCheckOffChallenge({
    id: 'reading-1',
    startDate: overrides.startDate ?? START_DATE,
    name: 'Atomic Habits',
    category: overrides.category ?? 'reading',
  });
}

/** The fields of a "Water Drinking" category: 8 glasses a day. */
export function waterFields(
  overrides: Partial<CustomCheckOffCategoryFields> = {},
): CustomCheckOffCategoryFields {
  return {
    name: 'Water Drinking',
    tone: 'sky',
    icon: '💧',
    dailyGoal: 8,
    unit: 'glasses',
    ...overrides,
  };
}

/** A "Water Drinking" category of the user's own: 8 glasses a day. */
export function aWaterCategory(
  overrides: Partial<CustomCheckOffCategoryFields> = {},
): CustomCheckOffCategory {
  return createCustomCheckOffCategory('water', waterFields(overrides));
}

/** A "Water Drinking" challenge (8 glasses a day), starting on START_DATE. */
export function aWaterChallenge(category = aWaterCategory()): CheckOffChallenge {
  return createCustomCheckOffChallenge({
    id: 'water-1',
    startDate: START_DATE,
    name: category.name,
    category,
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
  options: { recordedOnDay?: number; note?: string; count?: number } = {},
): CheckIn {
  checkInCounter++;
  return createCheckIn({
    id: `check-in-${checkInCounter}`,
    challenge,
    dayNumber,
    recordedOn: dateOfDay(challenge, options.recordedOnDay ?? dayNumber),
    note: options.note,
    count: options.count,
  });
}
