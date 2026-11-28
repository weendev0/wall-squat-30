import {
  createAttempt,
  createCheckIn,
  createCheckOffChallenge,
  createTimedChallenge,
} from '../../domain';
import { DexieAttemptRepository } from './dexie-attempt-repository';
import { DexieChallengeRepository } from './dexie-challenge-repository';
import { DexieCheckInRepository } from './dexie-check-in-repository';
import { DexieCheckOffCategoryRepository } from './dexie-check-off-category-repository';
import { DexieTimedCategoryRepository } from './dexie-timed-category-repository';
import { WallSquatDatabase } from './wall-squat-database';
import { aWaterCategory } from '../../domain/testing/domain-builders';

describe('Dexie repositories', () => {
  let database: WallSquatDatabase;
  let challenges: DexieChallengeRepository;
  let attempts: DexieAttemptRepository;
  let checkIns: DexieCheckInRepository;

  const challenge = createTimedChallenge({ id: 'c1', startDate: '2026-11-16', targetSeconds: 60 });
  const attempt = createAttempt({
    id: 'a1',
    challenge,
    dayNumber: 1,
    recordedOn: '2026-11-16',
    durationSeconds: 65,
    source: 'timer',
  });
  const reading = createCheckOffChallenge({
    id: 'r1',
    startDate: '2026-11-23',
    name: 'Atomic Habits',
    category: 'reading',
  });
  const checkIn = createCheckIn({
    id: 'k1',
    challenge: reading,
    dayNumber: 2,
    recordedOn: '2026-11-24',
    note: 'Make the cue obvious',
  });

  beforeEach(async () => {
    // A fresh database per test, so tests never share data.
    database = new WallSquatDatabase(`test-${crypto.randomUUID()}`);
    challenges = new DexieChallengeRepository(database);
    attempts = new DexieAttemptRepository(database);
    checkIns = new DexieCheckInRepository(database);
  });

  afterEach(async () => {
    await database.delete();
  });

  it('saves and finds every active challenge, of both kinds', async () => {
    await challenges.save(challenge);
    await challenges.save(reading);

    expect(await challenges.findAllActive()).toEqual(expect.arrayContaining([challenge, reading]));
    expect(await challenges.findById('r1')).toEqual(reading);
  });

  it('returns null when nothing is stored', async () => {
    expect(await challenges.findAllActive()).toEqual([]);
    expect(await checkIns.findByDay('r1', 1)).toBeNull();
    expect(await attempts.findById('missing')).toBeNull();
  });

  it('lists challenges newest first', async () => {
    const older = createTimedChallenge({ id: 'c0', startDate: '2026-10-01', targetSeconds: 60 });
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

  it('saves, finds by day and deletes check-ins', async () => {
    await checkIns.save(checkIn);

    expect(await checkIns.findByDay('r1', 2)).toEqual(checkIn);
    expect(await checkIns.findByChallenge('r1')).toEqual([checkIn]);

    await checkIns.delete('k1');
    expect(await checkIns.findAll()).toEqual([]);
  });

  it('BR-14: refuses a second check-in for the same day', async () => {
    await checkIns.save(checkIn);

    await expect(checkIns.save({ ...checkIn, id: 'k2' })).rejects.toThrow();
  });

  it('BR-15: keeps timed categories in the order they were added, and clears them', async () => {
    const categories = new DexieTimedCategoryRepository(database);
    await categories.save({ id: 't2', name: 'Plank' });
    await categories.save({ id: 't1', name: 'Lunge hold' });

    expect((await categories.findAll()).map((category) => category.name)).toEqual([
      'Plank',
      'Lunge hold',
    ]);

    await categories.deleteAll();
    expect(await categories.findAll()).toEqual([]);
  });

  it('BR-21, BR-24: saves your categories in order, edits in place, deletes and clears', async () => {
    const categories = new DexieCheckOffCategoryRepository(database);
    const water = aWaterCategory();
    const walk = { ...aWaterCategory({ name: 'Walk', icon: '🚶' }), id: 'walk' };
    await categories.save(water);
    await categories.save(walk);

    await categories.save({ ...water, name: 'Water' });

    expect((await categories.findAll()).map(({ name }) => name)).toEqual(['Water', 'Walk']);
    expect(await categories.findById('walk')).toEqual(walk);

    await categories.delete('walk');
    expect(await categories.findById('walk')).toBeNull();

    await categories.deleteAll();
    expect(await categories.findAll()).toEqual([]);
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
