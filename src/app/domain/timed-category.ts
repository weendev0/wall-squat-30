import { MAX_CHALLENGE_NAME_LENGTH, WALL_SQUAT_NAME } from './challenge-rules.constants';
import { DomainError } from './domain-error';

/**
 * BR-15: a category the user added for timed challenges, for example "Plank".
 * Wall Squat is built in and never stored.
 */
export interface TimedCategory {
  readonly id: string;
  readonly name: string;
}

/** BR-15: creates a category after checking its name. */
export function createTimedCategory(id: string, name: string): TimedCategory {
  return { id, name: validCategoryName(name) };
}

/** BR-15: a name is trimmed, required and short enough to fit on a Today card. */
export function validCategoryName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_CHALLENGE_NAME_LENGTH) {
    throw new DomainError(
      `A category needs a name of 1 to ${MAX_CHALLENGE_NAME_LENGTH} characters.`,
    );
  }
  return trimmed;
}

/** BR-15: "plank" and "Plank" are the same category. */
export function isSameCategoryName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}

/**
 * BR-15: the names to offer on New challenge: Wall Squat first, then the saved
 * categories in the order they were added, without duplicates.
 */
export function timedCategoryNames(saved: readonly TimedCategory[]): string[] {
  const names = [WALL_SQUAT_NAME];
  for (const { name } of saved) {
    if (!names.some((existing) => isSameCategoryName(existing, name))) {
      names.push(name);
    }
  }
  return names;
}
