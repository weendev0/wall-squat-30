import Dexie, { EntityTable } from 'dexie';
import { Attempt, Challenge } from '../../domain';

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
 * Example for a future change:
 *   this.version(2).stores({ ... }).upgrade((tx) =>
 *     tx.table('attempts').toCollection().modify((attempt) => { attempt.newField = 'default'; }));
 */
export class WallSquatDatabase extends Dexie {
  challenges!: EntityTable<Challenge, 'id'>;
  attempts!: EntityTable<Attempt, 'id'>;

  constructor(name: string = DATABASE_NAME) {
    super(name);

    // Version 1: only the listed fields are indexed; every other field is stored as-is.
    this.version(1).stores({
      challenges: 'id, status, startDate',
      attempts: 'id, challengeId',
    });
  }
}
