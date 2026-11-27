import Dexie from 'dexie';
import { DexieAttemptRepository } from './dexie-attempt-repository';
import { DexieChallengeRepository } from './dexie-challenge-repository';
import { WallSquatDatabase } from './wall-squat-database';

/**
 * Upgrade tests (spec section 5): data saved by an older app version must come
 * through an update unchanged. Each test writes old-shape data with a plain Dexie
 * database at the old version, then opens it with today's WallSquatDatabase.
 */
describe('WallSquatDatabase upgrades', () => {
  let name: string;

  beforeEach(() => {
    name = `upgrade-test-${crypto.randomUUID()}`;
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it('version 1 to 2: keeps the wall squat challenge and its attempts, and names it', async () => {
    const version1 = new Dexie(name);
    version1
      .version(1)
      .stores({ challenges: 'id, status, startDate', attempts: 'id, challengeId' });
    const oldChallenge = {
      id: 'c1',
      startDate: '2026-11-16',
      targetSeconds: 60,
      status: 'active',
      completedOn: null,
      celebrationShown: false,
    };
    const oldAttempt = {
      id: 'a1',
      challengeId: 'c1',
      dayNumber: 1,
      recordedOn: '2026-11-16',
      durationSeconds: 74,
      source: 'timer',
      isMakeUp: false,
      feeling: 'solid',
      note: 'Felt good',
    };
    await version1.table('challenges').put(oldChallenge);
    await version1.table('attempts').put(oldAttempt);
    version1.close();

    const upgraded = new WallSquatDatabase(name);
    const challenge = await new DexieChallengeRepository(upgraded).findById('c1');
    const attempts = await new DexieAttemptRepository(upgraded).findByChallenge('c1');

    expect(challenge).toEqual({
      ...oldChallenge,
      name: 'Wall squat',
      kind: 'timed',
      category: 'exercise',
    });
    expect(attempts).toEqual([oldAttempt]);
    expect(await upgraded.checkIns.count()).toBe(0);
    upgraded.close();
  });
});
