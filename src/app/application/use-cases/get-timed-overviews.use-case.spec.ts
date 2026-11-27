import { DomainError } from '../../domain';
import { createTestApp } from '../testing/test-app';

describe('GetTimedOverviewsUseCase', () => {
  it('returns nothing when no timed challenge was ever started', async () => {
    const app = createTestApp();
    expect(await app.getTimedOverviews.execute()).toEqual([]);
  });

  it("shows today's day number, day results and totals", async () => {
    const app = createTestApp('2026-11-16');
    const challenge = await app.startChallenge.execute();
    await app.recordAttempt.execute({
      challengeId: challenge.id,
      durationSeconds: 65,
      source: 'timer',
    });
    app.clock.currentDate = '2026-11-17';
    await app.recordAttempt.execute({
      challengeId: challenge.id,
      durationSeconds: 70,
      source: 'timer',
    });

    const [overview] = await app.getTimedOverviews.execute();

    expect(overview.todayDayNumber).toBe(2);
    expect(overview.days[0].status).toBe('complete');
    expect(overview.progress.currentStreak).toBe(2);
    expect(overview.progress.bestHoldSeconds).toBe(70);
    expect(overview.needsCelebration).toBe(false);
  });

  it('BR-16, BR-17: lists each running category with its own days, oldest start first', async () => {
    const app = createTestApp('2026-11-16');
    const wallSquat = await app.startChallenge.execute(60, 'Wall Squat');
    app.clock.currentDate = '2026-11-20';
    const plank = await app.startChallenge.execute(45, 'Plank');
    await app.recordAttempt.execute({
      challengeId: plank.id,
      durationSeconds: 50,
      source: 'timer',
    });

    const overviews = await app.getTimedOverviews.execute();

    expect(overviews.map((overview) => overview.challenge.id)).toEqual([wallSquat.id, plank.id]);
    expect(overviews.map((overview) => overview.todayDayNumber)).toEqual([5, 1]);
    expect(overviews[0].attempts).toEqual([]);
    expect(overviews[1].days[0].status).toBe('complete');
  });

  describe('BR-10: after day 30', () => {
    async function appAfterDay30() {
      const app = createTestApp('2026-11-16');
      const challenge = await app.startChallenge.execute();
      app.clock.currentDate = '2026-12-16'; // the day after day 30
      return { app, challenge };
    }

    it('completes the challenge and asks for the celebration', async () => {
      const { app, challenge } = await appAfterDay30();

      const [overview] = await app.getTimedOverviews.execute();

      expect(overview.challenge.status).toBe('completed');
      expect(overview.todayDayNumber).toBeNull();
      expect(overview.needsCelebration).toBe(true);
      expect((await app.challenges.findById(challenge.id))?.status).toBe('completed');
    });

    it('shows the celebration only once', async () => {
      const { app, challenge } = await appAfterDay30();
      await app.getTimedOverviews.execute();

      await app.markCelebrationShown.execute(challenge.id);

      expect(await app.getTimedOverviews.execute()).toEqual([]);
    });

    it('fails clearly when marking an unknown challenge', async () => {
      const { app } = await appAfterDay30();
      await expect(app.markCelebrationShown.execute('nope')).rejects.toThrow(DomainError);
    });

    it('refuses new attempts once day 30 has passed', async () => {
      const { app, challenge } = await appAfterDay30();
      await expect(
        app.recordAttempt.execute({
          challengeId: challenge.id,
          durationSeconds: 60,
          source: 'timer',
        }),
      ).rejects.toThrow('outside the challenge');
    });
  });
});
