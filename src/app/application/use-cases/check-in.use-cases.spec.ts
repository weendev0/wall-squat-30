import { DomainError } from '../../domain';
import { createTestApp } from '../testing/test-app';

describe('check-off challenge use cases', () => {
  async function startReading(app = createTestApp('2026-11-23')) {
    const reading = await app.startCheckOffChallenge.execute({
      name: 'Atomic Habits',
      category: 'reading',
    });
    return { app, reading };
  }

  describe('StartCheckOffChallengeUseCase (BR-13)', () => {
    it('starts today with the chosen name and category', async () => {
      const { app, reading } = await startReading();

      expect(reading).toMatchObject({
        kind: 'checkoff',
        category: 'reading',
        name: 'Atomic Habits',
        startDate: '2026-11-23',
      });
      expect(await app.challenges.findById(reading.id)).toEqual(reading);
    });

    it('runs beside the wall squat and other check-off challenges', async () => {
      const { app } = await startReading();
      await app.startChallenge.execute();
      await app.startCheckOffChallenge.execute({ name: 'Angular signals', category: 'course' });

      expect(await app.challenges.findAllActive()).toHaveLength(3);
    });
  });

  describe('CheckInUseCase (BR-14, BR-15, BR-17)', () => {
    it('marks today as done with a note', async () => {
      const { app, reading } = await startReading();
      app.clock.currentDate = '2026-11-27'; // Day 5

      const checkIn = await app.checkIn.execute({ challengeId: reading.id, note: 'Chapter 3' });

      expect(checkIn).toMatchObject({ dayNumber: 5, isMakeUp: false, note: 'Chapter 3' });
      expect(await app.checkIns.findAll()).toEqual([checkIn]);
    });

    it('saves only one Done per day; a second Save updates the note', async () => {
      const { app, reading } = await startReading();
      const first = await app.checkIn.execute({ challengeId: reading.id, note: 'Chapter 1' });

      const second = await app.checkIn.execute({
        challengeId: reading.id,
        note: 'Chapter 1 and 2',
      });

      expect(second).toEqual({ ...first, note: 'Chapter 1 and 2' });
      expect(await app.checkIns.findAll()).toHaveLength(1);
    });

    it('keeps the existing note when Save sends none', async () => {
      const { app, reading } = await startReading();
      await app.checkIn.execute({ challengeId: reading.id, note: 'Chapter 1' });

      const again = await app.checkIn.execute({ challengeId: reading.id });

      expect(again.note).toBe('Chapter 1');
    });

    it('makes up an earlier day', async () => {
      const { app, reading } = await startReading();
      app.clock.currentDate = '2026-11-27';

      const checkIn = await app.checkIn.execute({ challengeId: reading.id, dayNumber: 1 });

      expect(checkIn).toMatchObject({ dayNumber: 1, isMakeUp: true });
    });

    it('refuses a wall squat challenge or one that does not exist', async () => {
      const { app } = await startReading();
      const wallSquat = await app.startChallenge.execute();

      await expect(app.checkIn.execute({ challengeId: wallSquat.id })).rejects.toThrow(DomainError);
      await expect(app.checkIn.execute({ challengeId: 'missing' })).rejects.toThrow(DomainError);
    });
  });

  describe('UndoCheckInUseCase (BR-14)', () => {
    it('takes the day back to not done', async () => {
      const { app, reading } = await startReading();
      await app.checkIn.execute({ challengeId: reading.id });

      await app.undoCheckIn.execute(reading.id, 1);

      expect(await app.checkIns.findAll()).toEqual([]);
    });

    it('does nothing when the day was not done', async () => {
      const { app, reading } = await startReading();

      await expect(app.undoCheckIn.execute(reading.id, 1)).resolves.toBeUndefined();
    });
  });

  it('BR-11: Reset all history also deletes check-ins', async () => {
    const { app, reading } = await startReading();
    await app.checkIn.execute({ challengeId: reading.id });

    await app.resetHistory.execute();

    expect(await app.checkIns.findAll()).toEqual([]);
    expect(await app.challenges.findAll()).toEqual([]);
  });
});
