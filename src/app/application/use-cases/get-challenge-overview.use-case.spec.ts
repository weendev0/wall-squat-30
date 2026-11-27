import { DomainError } from '../../domain';
import { createTestApp } from '../testing/test-app';

describe('GetChallengeOverviewUseCase', () => {
  it('returns null when no challenge was ever started, so the app opens New challenge', async () => {
    const app = createTestApp();
    expect(await app.getOverview.execute()).toBeNull();
  });

  it("shows today's day number, day results and totals", async () => {
    const app = createTestApp('2026-11-16');
    await app.startChallenge.execute();
    await app.recordAttempt.execute({ durationSeconds: 65, source: 'timer' });
    app.clock.currentDate = '2026-11-17';
    await app.recordAttempt.execute({ durationSeconds: 70, source: 'timer' });

    const overview = await app.getOverview.execute();

    expect(overview?.todayDayNumber).toBe(2);
    expect(overview?.days[0].status).toBe('complete');
    expect(overview?.progress.currentStreak).toBe(2);
    expect(overview?.progress.bestHoldSeconds).toBe(70);
    expect(overview?.needsCelebration).toBe(false);
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

      const overview = await app.getOverview.execute();

      expect(overview?.challenge.status).toBe('completed');
      expect(overview?.todayDayNumber).toBeNull();
      expect(overview?.needsCelebration).toBe(true);
      expect((await app.challenges.findById(challenge.id))?.status).toBe('completed');
    });

    it('shows the celebration only once', async () => {
      const { app, challenge } = await appAfterDay30();
      await app.getOverview.execute();

      await app.markCelebrationShown.execute(challenge.id);

      expect(await app.getOverview.execute()).toBeNull();
    });

    it('fails clearly when marking an unknown challenge', async () => {
      const { app } = await appAfterDay30();
      await expect(app.markCelebrationShown.execute('nope')).rejects.toThrow(DomainError);
    });

    it('refuses new attempts once day 30 has passed', async () => {
      const { app } = await appAfterDay30();
      await expect(
        app.recordAttempt.execute({ durationSeconds: 60, source: 'timer' }),
      ).rejects.toThrow('outside the challenge');
    });
  });
});
