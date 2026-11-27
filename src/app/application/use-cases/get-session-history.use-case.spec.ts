import { createTestApp } from '../testing/test-app';

describe('GetSessionHistoryUseCase', () => {
  it('groups attempts by day, newest day first and longest attempt first', async () => {
    const app = createTestApp('2026-11-16');
    await app.startChallenge.execute(60);
    await app.recordAttempt.execute({ durationSeconds: 41, source: 'timer' });
    await app.recordAttempt.execute({ durationSeconds: 68, source: 'timer' });
    app.clock.currentDate = '2026-11-18'; // day 3, day 2 missed
    await app.recordAttempt.execute({ durationSeconds: 50, source: 'timer' });

    const [sessions] = await app.getSessionHistory.execute();

    expect(sessions.attemptCount).toBe(3);
    expect(sessions.missedDayCount).toBe(1);
    expect(sessions.days.map((day) => [day.dayNumber, day.status, day.bestSeconds])).toEqual([
      [3, 'under-target', 50],
      [1, 'complete', 68],
    ]);
    expect(sessions.days[1].attempts.map((attempt) => attempt.durationSeconds)).toEqual([68, 41]);
  });

  it('lists every challenge, newest first', async () => {
    const app = createTestApp('2026-10-01');
    await app.startChallenge.execute(60);
    app.clock.currentDate = '2026-11-05'; // the October challenge has ended
    await app.getOverview.execute();
    await app.startChallenge.execute(90);

    const history = await app.getSessionHistory.execute();

    expect(history.map((sessions) => sessions.challenge.targetSeconds)).toEqual([90, 60]);
    expect(history[1].challenge.status).toBe('completed');
  });

  it('returns nothing when there is no history', async () => {
    expect(await createTestApp().getSessionHistory.execute()).toEqual([]);
  });
});
