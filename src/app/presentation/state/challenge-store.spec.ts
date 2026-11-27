import { TestBed } from '@angular/core/testing';
import { provideWallSquatTesting } from '../../composition/testing/provide-wall-squat-testing';
import { ChallengeStore } from './challenge-store';

describe('ChallengeStore', () => {
  let store: ChallengeStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideWallSquatTesting('2026-11-16').providers });
    store = TestBed.inject(ChallengeStore);
  });

  it('has nothing to show before a challenge is started', async () => {
    expect(await store.load()).toBeNull();
    expect(store.today()).toBeNull();
  });

  it('shows the new challenge right after it starts', async () => {
    await store.start(90);

    expect(store.overview()?.challenge.targetSeconds).toBe(90);
    expect(store.today()?.dayNumber).toBe(1);
  });

  it('refreshes today and remembers the save notice after an attempt', async () => {
    await store.start(60);

    await store.record({ durationSeconds: 65, source: 'timer' });

    expect(store.today()?.status).toBe('complete');
    expect(store.savedNotice()).toEqual({ durationSeconds: 65, isPersonalBest: true });

    store.dismissSavedNotice();
    expect(store.savedNotice()).toBeNull();
  });

  it('leaves everything as it was when a hold is too short', async () => {
    await store.start(60);

    const result = await store.record({ durationSeconds: 3, source: 'timer' });

    expect(result.status).toBe('too-short');
    expect(store.today()?.attemptCount).toBe(0);
    expect(store.savedNotice()).toBeNull();
  });
});
