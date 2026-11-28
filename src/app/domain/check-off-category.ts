import {
  MAX_CHALLENGE_NAME_LENGTH,
  MAX_DAILY_GOAL,
  MAX_UNIT_LENGTH,
} from './challenge-rules.constants';
import { DomainError } from './domain-error';
import { isSameCategoryName } from './timed-category';

/** The check-off categories that come with the app. They cannot be changed (BR-24). */
export const BUILT_IN_CHECK_OFF_CATEGORIES = ['reading', 'course', 'study'] as const;
export type BuiltInCheckOffCategory = (typeof BUILT_IN_CHECK_OFF_CATEGORIES)[number];

/** The name of each built-in category, as the user sees it. */
export const BUILT_IN_CHECK_OFF_NAMES: Record<BuiltInCheckOffCategory, string> = {
  reading: 'Reading',
  course: 'Course',
  study: 'Study',
};

/** BR-21: the colours a category of your own can take. */
export const CATEGORY_TONES = ['sky', 'lilac', 'rose', 'leaf', 'sun', 'mint'] as const;
export type CategoryTone = (typeof CATEGORY_TONES)[number];

/** BR-21: the icons a category of your own can take. */
export const CATEGORY_ICONS = [
  '💧',
  '🏃',
  '🚶',
  '🧘',
  '🥗',
  '🍎',
  '💤',
  '💊',
  '🎸',
  '✍️',
  '🌱',
  '🧹',
] as const;

/** A goal of 1 means Just Done: one tap finishes the day (BR-22). */
export const JUST_DONE_GOAL = 1;

/**
 * BR-21, BR-22: a daily check-off category the user added, such as Water Drinking.
 * A dailyGoal of 1 is Just Done; more than 1 counts up to the goal, in `unit`.
 */
export interface CustomCheckOffCategory {
  readonly id: string;
  readonly name: string;
  readonly tone: CategoryTone;
  readonly icon: string;
  readonly dailyGoal: number;
  /** For example "glasses". Empty for Just Done. */
  readonly unit: string;
}

/** What the user fills in on the category sheet. */
export type CustomCheckOffCategoryFields = Omit<CustomCheckOffCategory, 'id'>;

/** BR-21, BR-22: creates a category after checking every field. */
export function createCustomCheckOffCategory(
  id: string,
  fields: CustomCheckOffCategoryFields,
): CustomCheckOffCategory {
  return { id, ...validFields(fields) };
}

/** BR-24: the same checks apply when a category is edited; the id never changes. */
export function editCustomCheckOffCategory(
  category: CustomCheckOffCategory,
  fields: CustomCheckOffCategoryFields,
): CustomCheckOffCategory {
  return createCustomCheckOffCategory(category.id, fields);
}

/** True when a day is counted up to a goal, false for Just Done (BR-22). */
export function isCountedGoal(dailyGoal: number): boolean {
  return dailyGoal > JUST_DONE_GOAL;
}

/**
 * BR-21: a name must not match a built-in category or another category of yours,
 * ignoring case. Pass `exceptId` when editing, so a category does not clash with itself.
 */
export function assertCategoryNameIsFree(
  name: string,
  existing: readonly CustomCheckOffCategory[],
  exceptId?: string,
): void {
  const builtInNames = Object.values(BUILT_IN_CHECK_OFF_NAMES);
  const otherNames = existing.filter((other) => other.id !== exceptId).map((other) => other.name);
  const clash = [...builtInNames, ...otherNames].find((known) => isSameCategoryName(known, name));
  if (clash !== undefined) {
    throw new DomainError(`There is already a category called ${clash}.`);
  }
}

function validFields(fields: CustomCheckOffCategoryFields): CustomCheckOffCategoryFields {
  const name = fields.name.trim();
  if (name.length === 0 || name.length > MAX_CHALLENGE_NAME_LENGTH) {
    throw new DomainError(
      `A category needs a name of 1 to ${MAX_CHALLENGE_NAME_LENGTH} characters.`,
    );
  }
  if (!CATEGORY_TONES.includes(fields.tone)) {
    throw new DomainError('Pick one of the colours.');
  }
  if (!(CATEGORY_ICONS as readonly string[]).includes(fields.icon)) {
    throw new DomainError('Pick one of the icons.');
  }
  assertValidGoal(fields.dailyGoal);

  const unit = isCountedGoal(fields.dailyGoal) ? fields.unit.trim() : '';
  if (isCountedGoal(fields.dailyGoal) && (unit.length === 0 || unit.length > MAX_UNIT_LENGTH)) {
    throw new DomainError(`Say what you count, in 1 to ${MAX_UNIT_LENGTH} characters.`);
  }
  return { name, tone: fields.tone, icon: fields.icon, dailyGoal: fields.dailyGoal, unit };
}

function assertValidGoal(dailyGoal: number): void {
  const isInRange = dailyGoal >= JUST_DONE_GOAL && dailyGoal <= MAX_DAILY_GOAL;
  if (!Number.isInteger(dailyGoal) || !isInRange) {
    throw new DomainError(`The daily goal must be a whole number up to ${MAX_DAILY_GOAL}.`);
  }
}
