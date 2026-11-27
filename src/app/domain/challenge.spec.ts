import {
  completeChallenge,
  createChallenge,
  dateOfDay,
  dayNumberOn,
  hasChallengeEnded,
  markCelebrationShown,
} from './challenge';
import { DomainError } from './domain-error';
import { aChallenge, START_DATE } from './testing/domain-builders';

describe('challenge', () => {
  describe('BR-01: 30 calendar days from the start day', () => {
    const challenge = aChallenge();

    it('makes the start day Day 1 and the 30th day Day 30', () => {
      expect(dateOfDay(challenge, 1)).toBe(START_DATE);
      expect(dateOfDay(challenge, 30)).toBe('2026-12-15');
    });

    it('finds the day number of a date', () => {
      expect(dayNumberOn(challenge, '2026-11-27')).toBe(12);
    });

    it('returns null for dates outside the 30 days', () => {
      expect(dayNumberOn(challenge, '2026-11-15')).toBeNull();
      expect(dayNumberOn(challenge, '2026-12-16')).toBeNull();
    });

    it('rejects a day number outside 1 to 30', () => {
      expect(() => dateOfDay(challenge, 0)).toThrow(DomainError);
      expect(() => dateOfDay(challenge, 31)).toThrow(DomainError);
    });
  });

  describe('BR-02: target fixed per challenge', () => {
    it('starts active with the chosen target', () => {
      const challenge = createChallenge({ id: 'c1', startDate: START_DATE, targetSeconds: 75 });
      expect(challenge.status).toBe('active');
      expect(challenge.targetSeconds).toBe(75);
    });

    it.each([0, 4, 601, 60.5])('rejects a target of %d seconds', (targetSeconds) => {
      expect(() => createChallenge({ id: 'c1', startDate: START_DATE, targetSeconds })).toThrow(
        DomainError,
      );
    });
  });

  describe('BR-10: ends after day 30', () => {
    const challenge = aChallenge();

    it('is still running on day 30', () => {
      expect(hasChallengeEnded(challenge, '2026-12-15')).toBe(false);
    });

    it('has ended the day after day 30', () => {
      expect(hasChallengeEnded(challenge, '2026-12-16')).toBe(true);
    });

    it('can be completed only after it has ended', () => {
      expect(() => completeChallenge(challenge, '2026-12-15')).toThrow(DomainError);

      const completed = completeChallenge(challenge, '2026-12-16');
      expect(completed.status).toBe('completed');
      expect(completed.completedOn).toBe('2026-12-16');
    });

    it('remembers that the celebration was shown', () => {
      expect(markCelebrationShown(challenge).celebrationShown).toBe(true);
    });
  });
});
