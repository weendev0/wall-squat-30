import {
  CHALLENGE_LENGTH_DAYS,
  MAX_CHALLENGE_NAME_LENGTH,
  MAX_TARGET_SECONDS,
  MIN_TARGET_SECONDS,
  WALL_SQUAT_NAME,
} from './challenge-rules.constants';
import {
  BuiltInCheckOffCategory,
  CustomCheckOffCategory,
  JUST_DONE_GOAL,
} from './check-off-category';
import { DomainError } from './domain-error';
import { addDays, assertLocalDate, daysBetween, LocalDate } from './local-date';

export type ChallengeStatus = 'active' | 'completed';

/**
 * The two kinds of challenge (BR-13):
 * - timed: hold for a target time, like the wall squat
 * - checkoff: tap Done once a day, with an optional note (BR-14, BR-15)
 */
export type ChallengeKind = 'timed' | 'checkoff';

/**
 * What a check-off challenge is about: a built-in category, or 'custom' for one the
 * user added (BR-21). It also picks the colour on screen.
 */
export type CheckOffCategory = BuiltInCheckOffCategory | 'custom';

/** Timed challenges are always exercise; check-off challenges pick a category. */
export type ChallengeCategory = 'exercise' | CheckOffCategory;

/** The fields every challenge has, whatever its kind. */
interface ChallengeBase {
  readonly id: string;
  /** Shown on Today, for example "Wall Squat" or "Atomic Habits". */
  readonly name: string;
  /** BR-01: Day 1 is the day the user pressed Start challenge. */
  readonly startDate: LocalDate;
  readonly status: ChallengeStatus;
  /** Set when the challenge ends after day 30 (BR-10). */
  readonly completedOn: LocalDate | null;
  /** BR-10: the celebration screen is shown only once. */
  readonly celebrationShown: boolean;
}

/** A challenge measured with the timer. */
export interface TimedChallenge extends ChallengeBase {
  readonly kind: 'timed';
  readonly category: 'exercise';
  /** BR-02: fixed for the whole challenge. */
  readonly targetSeconds: number;
}

/** A challenge that only needs a daily Done (BR-14). */
export interface CheckOffChallenge extends ChallengeBase {
  readonly kind: 'checkoff';
  readonly category: CheckOffCategory;
  /** BR-21: the user's own category, when `category` is 'custom'. Otherwise null. */
  readonly customCategoryId: string | null;
  /**
   * BR-22: copied from the category when the challenge starts, so editing the category
   * later never changes a running challenge. 1 means Just Done.
   */
  readonly dailyGoal: number;
  /** BR-22: what is counted, such as "glasses". Empty for Just Done. */
  readonly unit: string;
}

/**
 * One 30-day challenge. Several can run at the same time, each with its own
 * start date (BR-13). Check `kind` before using kind-specific fields.
 */
export type Challenge = TimedChallenge | CheckOffChallenge;

export interface NewTimedChallengeInput {
  readonly id: string;
  readonly startDate: LocalDate;
  readonly targetSeconds: number;
  /** Defaults to "Wall Squat". */
  readonly name?: string;
}

export interface NewCheckOffChallengeInput {
  readonly id: string;
  readonly startDate: LocalDate;
  readonly name: string;
  readonly category: BuiltInCheckOffCategory;
}

export interface NewCustomCheckOffChallengeInput {
  readonly id: string;
  readonly startDate: LocalDate;
  readonly name: string;
  readonly category: CustomCheckOffCategory;
}

/** BR-01 and BR-02: creates a new active timed challenge after checking the input. */
export function createTimedChallenge(input: NewTimedChallengeInput): TimedChallenge {
  assertValidTarget(input.targetSeconds);
  return {
    ...newChallengeBase(input.id, input.startDate, input.name ?? WALL_SQUAT_NAME),
    kind: 'timed',
    category: 'exercise',
    targetSeconds: input.targetSeconds,
  };
}

/** BR-13 and BR-14: creates a new Reading, Course or Study challenge (Just Done). */
export function createCheckOffChallenge(input: NewCheckOffChallengeInput): CheckOffChallenge {
  return {
    ...newChallengeBase(input.id, input.startDate, input.name),
    kind: 'checkoff',
    category: input.category,
    customCategoryId: null,
    dailyGoal: JUST_DONE_GOAL,
    unit: '',
  };
}

/** BR-21 and BR-22: creates a challenge in the user's own category, copying its goal. */
export function createCustomCheckOffChallenge(
  input: NewCustomCheckOffChallengeInput,
): CheckOffChallenge {
  return {
    ...newChallengeBase(input.id, input.startDate, input.name),
    kind: 'checkoff',
    category: 'custom',
    customCategoryId: input.category.id,
    dailyGoal: input.category.dailyGoal,
    unit: input.category.unit,
  };
}

/** True for a timed challenge. Lets TypeScript know `targetSeconds` is there. */
export function isTimedChallenge(challenge: Challenge): challenge is TimedChallenge {
  return challenge.kind === 'timed';
}

/** True for a check-off challenge. */
export function isCheckOffChallenge(challenge: Challenge): challenge is CheckOffChallenge {
  return challenge.kind === 'checkoff';
}

function newChallengeBase(id: string, startDate: LocalDate, name: string): ChallengeBase {
  assertLocalDate(startDate);
  return {
    id,
    name: validName(name),
    startDate,
    status: 'active',
    completedOn: null,
    celebrationShown: false,
  };
}

/** A name is required, trimmed and short enough to fit on a Today card. */
function validName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_CHALLENGE_NAME_LENGTH) {
    throw new DomainError(
      `Give the challenge a name of 1 to ${MAX_CHALLENGE_NAME_LENGTH} characters.`,
    );
  }
  return trimmed;
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
export function completeChallenge<T extends Challenge>(challenge: T, today: LocalDate): T {
  if (!hasChallengeEnded(challenge, today)) {
    throw new DomainError('A challenge can only be completed after day 30.');
  }
  return { ...challenge, status: 'completed', completedOn: today };
}

/** BR-10: remembers that the celebration was shown, so it never shows twice. */
export function markCelebrationShown<T extends Challenge>(challenge: T): T {
  return { ...challenge, celebrationShown: true };
}

/**
 * BR-07: checks that `dayNumber` can be recorded on `recordedOn` (today or an earlier
 * challenge day, while the challenge is still running) and tells whether it is a make-up.
 */
export function isMakeUpDay(
  challenge: Challenge,
  dayNumber: number,
  recordedOn: LocalDate,
): boolean {
  assertLocalDate(recordedOn);
  const dayDate = dateOfDay(challenge, dayNumber);
  const isFutureDay = dayDate > recordedOn;
  if (isFutureDay || dayNumberOn(challenge, recordedOn) === null) {
    throw new DomainError('You can only record today or earlier challenge days.');
  }
  return dayDate < recordedOn;
}

export function assertValidDayNumber(dayNumber: number): void {
  const isInRange = dayNumber >= 1 && dayNumber <= CHALLENGE_LENGTH_DAYS;
  if (!Number.isInteger(dayNumber) || !isInRange) {
    throw new DomainError(`Day must be between 1 and ${CHALLENGE_LENGTH_DAYS}.`);
  }
}
