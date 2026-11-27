import Dexie, { EntityTable } from 'dexie';
import { Attempt, Challenge, CheckIn, WALL_SQUAT_NAME } from '../../domain';

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
