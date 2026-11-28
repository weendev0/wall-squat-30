import {
  completeChallenge,
  createCheckOffChallenge,
  createTimedChallenge,
  dateOfDay,
  dayNumberOn,
  hasChallengeEnded,
  isCheckOffChallenge,
  isMakeUpDay,
  isTimedChallenge,
  markCelebrationShown,
} from './challenge';
import { DomainError } from './domain-error';
import {
  aChallenge,
  aCheckOffChallenge,
  aWaterChallenge,
  START_DATE,
} from './testing/domain-builders';

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
      const challenge = createTimedChallenge({
        id: 'c1',
        startDate: START_DATE,
        targetSeconds: 75,
      });
      expect(challenge.status).toBe('active');
      expect(challenge.targetSeconds).toBe(75);
    });

    it.each([0, 4, 601, 60.5])('rejects a target of %d seconds', (targetSeconds) => {
      expect(() =>
        createTimedChallenge({ id: 'c1', startDate: START_DATE, targetSeconds }),
      ).toThrow(DomainError);
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

  describe('BR-13: two kinds of challenge', () => {
    it('makes a timed challenge an exercise called Wall Squat by default', () => {
      const challenge = aChallenge();

      expect(challenge).toMatchObject({ kind: 'timed', category: 'exercise', name: 'Wall Squat' });
      expect(isTimedChallenge(challenge)).toBe(true);
      expect(isCheckOffChallenge(challenge)).toBe(false);
    });

    it('makes a check-off challenge with its own name and category', () => {
      const challenge = createCheckOffChallenge({
        id: 'r1',
        startDate: START_DATE,
        name: '  Atomic Habits ',
        category: 'reading',
      });

      expect(challenge).toMatchObject({
        kind: 'checkoff',
        category: 'reading',
        name: 'Atomic Habits',
        status: 'active',
      });
      expect(isCheckOffChallenge(challenge)).toBe(true);
    });

    it.each(['', '   ', 'x'.repeat(41)])('rejects the name "%s"', (name) => {
      expect(() =>
        createCheckOffChallenge({ id: 'r1', startDate: START_DATE, name, category: 'study' }),
      ).toThrow(DomainError);
    });

    it('keeps the kind when the challenge is completed', () => {
      const completed = completeChallenge(aCheckOffChallenge(), '2026-12-16');
      expect(completed.kind).toBe('checkoff');
    });
  });

  describe('BR-07 and BR-17: which days can be recorded', () => {
    const challenge = aCheckOffChallenge(); // Day 1 = 16 Nov

    it('records today as a normal day', () => {
      expect(isMakeUpDay(challenge, 12, '2026-11-27')).toBe(false);
    });

    it('records an earlier day as a make-up', () => {
      expect(isMakeUpDay(challenge, 3, '2026-11-27')).toBe(true);
    });

    it('refuses a future day and any day after the challenge', () => {
      expect(() => isMakeUpDay(challenge, 13, '2026-11-27')).toThrow(DomainError);
      expect(() => isMakeUpDay(challenge, 3, '2026-12-16')).toThrow(DomainError);
    });
  });
});

describe('BR-21, BR-22: a challenge in your own category', () => {
  it('copies the goal and unit from the category', () => {
    const challenge = aWaterChallenge();

    expect(challenge).toMatchObject({
      kind: 'checkoff',
      category: 'custom',
      customCategoryId: 'water',
      name: 'Water Drinking',
      dailyGoal: 8,
      unit: 'glasses',
    });
  });

  it('a built-in category is Just Done', () => {
    expect(aCheckOffChallenge()).toMatchObject({ customCategoryId: null, dailyGoal: 1, unit: '' });
  });
});
