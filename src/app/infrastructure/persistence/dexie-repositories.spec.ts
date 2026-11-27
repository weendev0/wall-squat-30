import { createAttempt, createChallenge } from '../../domain';
import { DexieAttemptRepository } from './dexie-attempt-repository';
import { DexieChallengeRepository } from './dexie-challenge-repository';
import { WallSquatDatabase } from './wall-squat-database';

describe('Dexie repositories', () => {
  let database: WallSquatDatabase;
  let challenges: DexieChallengeRepository;
  let attempts: DexieAttemptRepository;

  const challenge = createChallenge({ id: 'c1', startDate: '2026-11-16', targetSeconds: 60 });
  const attempt = createAttempt({
    id: 'a1',
    challenge,
    dayNumber: 1,
    recordedOn: '2026-11-16',
    durationSeconds: 65,
    source: 'timer',
  });

  beforeEach(async () => {
    // A fresh database per test, so tests never share data.
    database = new WallSquatDatabase(`test-${crypto.randomUUID()}`);
    challenges = new DexieChallengeRepository(database);
    attempts = new DexieAttemptRepository(database);
  });

  afterEach(async () => {
    await database.delete();
  });

  it('saves and finds the active challenge', async () => {
    await challenges.save(challenge);

    expect(await challenges.findActive()).toEqual(challenge);
    expect(await challenges.findById('c1')).toEqual(challenge);
  });

  it('returns null when nothing is stored', async () => {
    expect(await challenges.findActive()).toBeNull();
    expect(await attempts.findById('missing')).toBeNull();
  });

  it('lists challenges newest first', async () => {
    const older = createChallenge({ id: 'c0', startDate: '2026-10-01', targetSeconds: 60 });
    await challenges.save({ ...older, status: 'completed', completedOn: '2026-10-31' });
    await challenges.save(challenge);

    expect((await challenges.findAll()).map((c) => c.id)).toEqual(['c1', 'c0']);
  });

  it('saves, lists by challenge and deletes attempts', async () => {
    await attempts.save(attempt);
    expect(await attempts.findByChallenge('c1')).toEqual([attempt]);

    await attempts.delete('a1');
    expect(await attempts.findAll()).toEqual([]);
  });

  it('clears everything on reset', async () => {
    await challenges.save(challenge);
    await attempts.save(attempt);

    await attempts.deleteAll();
    await challenges.deleteAll();

    expect(await challenges.findAll()).toEqual([]);
    expect(await attempts.findAll()).toEqual([]);
  });

  it('keeps data when the database is closed and opened again, like after an app update', async () => {
    await challenges.save(challenge);
    database.close();

    const reopened = new WallSquatDatabase(database.name);
    expect(await new DexieChallengeRepository(reopened).findById('c1')).toEqual(challenge);
    reopened.close();
  });
});
