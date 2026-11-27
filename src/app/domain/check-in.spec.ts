import { MAX_NOTE_LENGTH } from './challenge-rules.constants';
import { createCheckIn, withNote } from './check-in';
import { DomainError } from './domain-error';
import { aCheckIn, aCheckOffChallenge } from './testing/domain-builders';

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
