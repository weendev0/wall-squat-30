import { DomainError } from '../../domain';
import { createTestApp } from '../testing/test-app';

/** Delete one attempt, reset everything and export: the History and Settings actions. */
describe('history management use cases', () => {
  async function appWithTwoAttempts() {
    const app = createTestApp('2026-11-16');
    await app.startChallenge.execute();
    await app.recordAttempt.execute({ durationSeconds: 65, source: 'timer', feeling: 'easy' });
    app.clock.currentDate = '2026-11-18'; // Day 3
    await app.recordAttempt.execute({
      durationSeconds: 52,
      source: 'manual',
      dayNumber: 2,
      note: 'tired, "short" one',
    });
    return app;
  }

  describe('DeleteAttemptUseCase (BR-09)', () => {
    it('removes the attempt, and the day goes back to missed', async () => {
      const app = await appWithTwoAttempts();
      const [first] = await app.attempts.findAll();

      await app.deleteAttempt.execute(first.id);

      const overview = await app.getOverview.execute();
      expect(overview?.days[0].status).toBe('missed');
    });

    it('fails clearly for an unknown attempt', async () => {
      const app = await appWithTwoAttempts();
      await expect(app.deleteAttempt.execute('nope')).rejects.toThrow(DomainError);
    });
  });

  describe('ResetHistoryUseCase (BR-11)', () => {
    it('deletes every challenge and attempt', async () => {
      const app = await appWithTwoAttempts();

      await app.resetHistory.execute();

      expect(app.challenges.items.size).toBe(0);
      expect(app.attempts.items.size).toBe(0);
      expect(await app.getOverview.execute()).toBeNull();
    });
  });

  describe('ExportHistoryCsvUseCase', () => {
    it('writes a header and one row per attempt, in day order, quoting where needed', async () => {
      const app = await appWithTwoAttempts();

      const csv = await app.exportCsv.execute();

      expect(csv.split('\n')).toEqual([
        'challenge_start,target,day,day_date,recorded_on,seconds,time,source,make_up,feeling,note',
        '2026-11-16,1:00,1,2026-11-16,2026-11-16,65,1:05,timer,no,easy,',
        '2026-11-16,1:00,2,2026-11-17,2026-11-18,52,0:52,manual,yes,none,"tired, ""short"" one"',
      ]);
    });

    it('writes only the header when there is no history', async () => {
      const app = createTestApp();
      expect(await app.exportCsv.execute()).toBe(
        'challenge_start,target,day,day_date,recorded_on,seconds,time,source,make_up,feeling,note',
      );
    });
  });
});
