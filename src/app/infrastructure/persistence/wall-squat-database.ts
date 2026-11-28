import Dexie, { EntityTable } from 'dexie';
import {
  Attempt,
  Challenge,
  CheckIn,
  CustomCheckOffCategory,
  JUST_DONE_GOAL,
  TimedCategory,
  WALL_SQUAT_NAME,
} from '../../domain';

/** A saved timed category with its position, so the picker keeps the order they were added. */
export interface StoredTimedCategory extends TimedCategory {
  readonly order: number;
}

/** A saved check-off category with its position, so New challenge keeps the order they were added. */
export interface StoredCheckOffCategory extends CustomCheckOffCategory {
  readonly order: number;
}

/** Never change this name: a new name means a new, empty database on the phone. */
export const DATABASE_NAME = 'wall-squat-30';

/**
 * The IndexedDB database on the phone, through the Dexie library.
 *
 * Keeping data through app updates (spec section 5):
 * - The database belongs to the web address, not to the app build, so an update keeps it.
 * - Never edit an existing `version(n)` block. To change the data shape, add a new block
 *   below it with the next number and an `.upgrade()` step, plus a test in
 *   wall-squat-database.spec.ts that loads old-shape data and checks the result.
 *
 * Version 2 below is a worked example of such a change.
 */
export class WallSquatDatabase extends Dexie {
  challenges!: EntityTable<Challenge, 'id'>;
  attempts!: EntityTable<Attempt, 'id'>;
  checkIns!: EntityTable<CheckIn, 'id'>;
  timedCategories!: EntityTable<StoredTimedCategory, 'id'>;
  checkOffCategories!: EntityTable<StoredCheckOffCategory, 'id'>;

  constructor(name: string = DATABASE_NAME) {
    super(name);

    // Version 1: only the listed fields are indexed; every other field is stored as-is.
    this.version(1).stores({
      challenges: 'id, status, startDate',
      attempts: 'id, challengeId',
    });

    // Version 2 (30 Days Challenges): challenges get a name, kind and category, and the
    // new checkIns table holds the daily Done of check-off challenges. '&[...]' is a unique
    // index, so the database itself refuses a second Done for the same day (BR-14).
    this.version(2)
      .stores({
        checkIns: 'id, challengeId, &[challengeId+dayNumber]',
      })
      .upgrade((tx) =>
        tx
          .table('challenges')
          .toCollection()
          .modify((challenge) => upgradeChallengeToVersion2(challenge)),
      );

    // Version 3 (timed categories, BR-15): a new table for the categories the user adds,
    // such as Plank. Nothing else changes, so no upgrade step is needed.
    this.version(3).stores({
      timedCategories: 'id, order',
    });

    // Version 4 (your own check-off categories, BR-21 to BR-24): a new table for categories
    // such as Water Drinking. Every check-in gets a count and every check-off challenge a
    // daily goal of 1 (Just Done), so all days saved before stay done.
    this.version(4)
      .stores({
        checkOffCategories: 'id, order',
      })
      .upgrade(async (tx) => {
        await tx
          .table('checkIns')
          .toCollection()
          .modify((checkIn) => upgradeCheckInToVersion4(checkIn));
        await tx
          .table('challenges')
          .toCollection()
          .modify((challenge) => upgradeChallengeToVersion4(challenge));
      });
  }
}

/**
 * Every challenge saved before version 2 is a wall squat challenge.
 */
function upgradeChallengeToVersion2(challenge: Record<string, unknown>): void {
  challenge['name'] ??= WALL_SQUAT_NAME;
  challenge['kind'] ??= 'timed';
  challenge['category'] ??= 'exercise';
}

/** Every check-in saved before version 4 was a single Done. */
function upgradeCheckInToVersion4(checkIn: Record<string, unknown>): void {
  checkIn['count'] ??= JUST_DONE_GOAL;
}

/** Every check-off challenge saved before version 4 is Reading, Course or Study: Just Done. */
function upgradeChallengeToVersion4(challenge: Record<string, unknown>): void {
  if (challenge['kind'] !== 'checkoff') {
    return;
  }
  challenge['customCategoryId'] ??= null;
  challenge['dailyGoal'] ??= JUST_DONE_GOAL;
  challenge['unit'] ??= '';
}
