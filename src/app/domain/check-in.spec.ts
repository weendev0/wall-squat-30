import { MAX_NOTE_LENGTH } from './challenge-rules.constants';
import { createCheckIn, isCheckInDone, withCount, withNote } from './check-in';
import { DomainError } from './domain-error';
import { aCheckIn, aCheckOffChallenge, aWaterChallenge } from './testing/domain-builders';

describe('check-in', () => {
  const challenge = aCheckOffChallenge(); // Day 1 = 16 Nov

  describe('BR-14: one Done per day', () => {
    it('marks the day it was tapped as done, not a make-up', () => {
      const checkIn = aCheckIn(challenge, 5);

      expect(checkIn).toMatchObject({
        challengeId: 'reading-1',
        dayNumber: 5,
        recordedOn: '2026-11-20',
        isMakeUp: false,
        note: '',
      });
    });

    it('refuses a day in the future', () => {
      expect(() =>
        createCheckIn({ id: 'k1', challenge, dayNumber: 6, recordedOn: '2026-11-20' }),
      ).toThrow(DomainError);
    });
  });

  describe('BR-15: an optional note', () => {
    it('trims the note', () => {
      expect(aCheckIn(challenge, 1, { note: '  Chapter 3  ' }).note).toBe('Chapter 3');
    });

    it('can change the note later and keeps everything else', () => {
      const checkIn = aCheckIn(challenge, 1, { note: 'Chapter 1' });
      const edited = withNote(checkIn, 'Chapter 1 and 2');

      expect(edited).toEqual({ ...checkIn, note: 'Chapter 1 and 2' });
    });

    it('refuses a note that is too long', () => {
      expect(() => aCheckIn(challenge, 1, { note: 'x'.repeat(MAX_NOTE_LENGTH + 1) })).toThrow(
        DomainError,
      );
    });
  });

  describe('BR-17: make-up days', () => {
    it('marks an earlier day as a make-up', () => {
      expect(aCheckIn(challenge, 1, { recordedOnDay: 4 }).isMakeUp).toBe(true);
    });
  });
});

describe('counted check-ins (BR-22, BR-23)', () => {
  const water = aWaterChallenge(); // 8 glasses a day, Day 1 = 16 Nov

  it('a Just Done check-in counts 1 and is done', () => {
    const reading = aCheckOffChallenge();
    const checkIn = aCheckIn(reading, 1);

    expect(checkIn.count).toBe(1);
    expect(isCheckInDone(reading, checkIn)).toBe(true);
  });

  it('a counted day is done only once the count reaches the goal', () => {
    expect(isCheckInDone(water, aCheckIn(water, 1, { count: 7 }))).toBe(false);
    expect(isCheckInDone(water, aCheckIn(water, 1, { count: 8 }))).toBe(true);
    expect(isCheckInDone(water, aCheckIn(water, 1, { count: 10 }))).toBe(true);
  });

  it('refuses a count below 1, above 99 or with a fraction', () => {
    const base = { id: 'k1', challenge: water, dayNumber: 1, recordedOn: '2026-11-16' };

    expect(() => createCheckIn({ ...base, count: 0 })).toThrow(DomainError);
    expect(() => createCheckIn({ ...base, count: 100 })).toThrow(DomainError);
    expect(() => createCheckIn({ ...base, count: 1.5 })).toThrow(DomainError);
  });

  it('changing the count on the same day keeps it on time', () => {
    const checkIn = aCheckIn(water, 5, { count: 3 });
    const updated = withCount(water, checkIn, 8, '2026-11-20');

    expect(updated).toMatchObject({ count: 8, recordedOn: '2026-11-20', isMakeUp: false });
  });

  it('BR-17: finishing a day on a later date makes it a make-up', () => {
    const checkIn = aCheckIn(water, 5, { count: 3 });
    const updated = withCount(water, checkIn, 8, '2026-11-22');

    expect(updated).toMatchObject({ count: 8, recordedOn: '2026-11-22', isMakeUp: true });
  });

  it('counting past the goal later does not turn a finished day into a make-up', () => {
    const checkIn = aCheckIn(water, 5, { count: 8 });
    const updated = withCount(water, checkIn, 9, '2026-11-22');

    expect(updated).toMatchObject({ count: 9, recordedOn: '2026-11-20', isMakeUp: false });
  });
});
