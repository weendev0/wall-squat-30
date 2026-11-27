import { Attempt } from './attempt';
import {
  calculateProgress,
  currentStreak,
  isPersonalBest,
  longestStreak,
} from './challenge-progress';
import { buildDayResults } from './day-result';
import { aChallenge, anAttempt } from './testing/domain-builders';

describe('challenge-progress', () => {
  const challenge = aChallenge({ targetSeconds: 60 });
  const today = '2026-11-27'; // Day 12

  /** Day numbers that hit the target on time, each with a 65-second attempt. */
  function onTimeDays(...dayNumbers: number[]): Attempt[] {
    return dayNumbers.map((day) => anAttempt(challenge, day, 65));
  }

  function streakOf(attempts: Attempt[]): number {
    return currentStreak(buildDayResults(challenge, attempts, today), today);
  }

  describe('BR-06: streak', () => {
    it('counts consecutive complete days up to yesterday while today is still open', () => {
      expect(streakOf(onTimeDays(8, 9, 10, 11))).toBe(4);
    });

    it('adds today once today is complete', () => {
      expect(streakOf(onTimeDays(10, 11, 12))).toBe(3);
    });

    it('resets after a missed day', () => {
      expect(streakOf(onTimeDays(1, 2, 3, 5, 6))).toBe(0);
    });

    it('resets after an under-target day', () => {
      expect(streakOf([...onTimeDays(9, 10), anAttempt(challenge, 11, 59)])).toBe(0);
    });

    it('BR-07: a made-up day never repairs the streak', () => {
      const attempts = [...onTimeDays(9, 10), anAttempt(challenge, 11, 70, { recordedOnDay: 12 })];
      expect(streakOf(attempts)).toBe(0);
    });

    it('finds the longest streak anywhere in the challenge', () => {
      const days = buildDayResults(challenge, onTimeDays(1, 2, 3, 5, 6), today);
      expect(longestStreak(days)).toBe(3);
    });
  });

  describe('totals', () => {
    const attempts = [
      anAttempt(challenge, 1, 45),
      anAttempt(challenge, 2, 52),
      anAttempt(challenge, 3, 60),
      anAttempt(challenge, 4, 74, { recordedOnDay: 6 }),
    ];
    const progress = calculateProgress(
      buildDayResults(challenge, attempts, today),
      attempts,
      today,
    );

    it('counts complete days, make-ups included', () => {
      expect(progress.daysComplete).toBe(2);
    });

    it('sums time, finds the best hold and the rounded average', () => {
      expect(progress.totalSeconds).toBe(231);
      expect(progress.bestHoldSeconds).toBe(74);
      expect(progress.averageSeconds).toBe(58);
    });

    it('lists past days that can still be made up', () => {
      expect(progress.daysToMakeUp).toEqual([1, 2, 5, 6, 7, 8, 9, 10, 11]);
    });

    it('has no best or average before the first attempt', () => {
      const empty = calculateProgress(buildDayResults(challenge, [], today), [], today);
      expect(empty.bestHoldSeconds).toBeNull();
      expect(empty.averageSeconds).toBeNull();
    });
  });

  it('spots a personal best only when it beats every earlier attempt', () => {
    const earlier = [anAttempt(challenge, 1, 72)];
    expect(isPersonalBest(74, earlier)).toBe(true);
    expect(isPersonalBest(72, earlier)).toBe(false);
    expect(isPersonalBest(30, [])).toBe(true);
  });
});
