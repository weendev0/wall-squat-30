import { createTestApp } from '../testing/test-app';

describe('GetCheckOffOverviewsUseCase', () => {
  it('returns nothing when no check-off challenge was started', async () => {
    const app = createTestApp();
    await app.startChallenge.execute();

    expect(await app.getCheckOffOverviews.execute()).toEqual([]);
  });

  it("shows each challenge's own day, days and totals (BR-13)", async () => {
    const app = createTestApp('2026-11-23');
    const reading = await app.startCheckOffChallenge.execute({
      name: 'Atomic Habits',
      category: 'reading',
    });
    await app.checkIn.execute({ challengeId: reading.id, note: 'Chapter 1' });
    app.clock.currentDate = '2026-11-26';
    const course = await app.startCheckOffChallenge.execute({
      name: 'Angular',
      category: 'course',
    });
    app.clock.currentDate = '2026-11-27';

    const [newest, oldest] = await app.getCheckOffOverviews.execute();

    expect(newest.challenge.id).toBe(course.id);
    expect(newest.todayDayNumber).toBe(2);
    expect(oldest.challenge.id).toBe(reading.id);
    expect(oldest.todayDayNumber).toBe(5);
    expect(oldest.progress.daysComplete).toBe(1);
    expect(oldest.checkIns.map((checkIn) => checkIn.note)).toEqual(['Chapter 1']);
    expect(oldest.days[0].hasNote).toBe(true);
  });

  it('BR-18: completes a challenge after its day 30 and asks for its celebration once', async () => {
    const app = createTestApp('2026-11-16');
    const reading = await app.startCheckOffChallenge.execute({ name: 'Book', category: 'reading' });
    app.clock.currentDate = '2026-12-16';

    const [overview] = await app.getCheckOffOverviews.execute();
    expect(overview.challenge.status).toBe('completed');
    expect(overview.needsCelebration).toBe(true);
    expect(overview.todayDayNumber).toBeNull();

    await app.markCelebrationShown.execute(reading.id);
    const [afterwards] = await app.getCheckOffOverviews.execute();
    expect(afterwards.needsCelebration).toBe(false);
  });

  it('lists running challenges before finished ones', async () => {
    const app = createTestApp('2026-10-01');
    await app.startCheckOffChallenge.execute({ name: 'Old book', category: 'reading' });
    app.clock.currentDate = '2026-11-20';
    await app.startCheckOffChallenge.execute({ name: 'New book', category: 'reading' });

    const overviews = await app.getCheckOffOverviews.execute();

    expect(overviews.map((o) => [o.challenge.name, o.challenge.status])).toEqual([
      ['New book', 'active'],
      ['Old book', 'completed'],
    ]);
  });
});
