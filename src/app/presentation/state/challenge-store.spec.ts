import { TestBed } from '@angular/core/testing';
import { provideWallSquatTesting } from '../../composition/testing/provide-wall-squat-testing';
import { ChallengeStore, todayResult } from './challenge-store';

describe('ChallengeStore', () => {
  let store: ChallengeStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideWallSquatTesting('2026-11-16').providers });
    store = TestBed.inject(ChallengeStore);
  });

  it('has nothing to show before a challenge is started', async () => {
    expect(await store.load()).toEqual([]);
    expect(store.active()).toEqual([]);
  });

  it('shows the new challenge right after it starts', async () => {
    const challenge = await store.start(90, 'Wall Squat');

    const overview = store.find(challenge.id)!;
    expect(overview.challenge.targetSeconds).toBe(90);
    expect(todayResult(overview)?.dayNumber).toBe(1);
  });

  it('BR-16: runs one timed challenge per category side by side', async () => {
    await store.start(60, 'Wall Squat');
    await store.start(45, 'Plank');

    expect(store.active().map((overview) => overview.challenge.name)).toEqual([
      'Wall Squat',
      'Plank',
    ]);
    await expect(store.start(60, 'plank')).rejects.toThrow('already running');
  });

  it('refreshes today and remembers the save notice after an attempt', async () => {
    const challenge = await store.start(60, 'Plank');

    await store.record({ challengeId: challenge.id, durationSeconds: 65, source: 'timer' });

    expect(todayResult(store.find(challenge.id)!)?.status).toBe('complete');
    expect(store.savedNotice()).toEqual({
      challengeId: challenge.id,
      durationSeconds: 65,
      isPersonalBest: true,
    });

    store.dismissSavedNotice();
    expect(store.savedNotice()).toBeNull();
  });

  it('leaves everything as it was when a hold is too short', async () => {
    const challenge = await store.start(60, 'Wall Squat');

    const result = await store.record({
      challengeId: challenge.id,
      durationSeconds: 3,
      source: 'timer',
    });

    expect(result.status).toBe('too-short');
    expect(todayResult(store.find(challenge.id)!)?.attemptCount).toBe(0);
    expect(store.savedNotice()).toBeNull();
  });
});
