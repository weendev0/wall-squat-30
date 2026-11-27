import { buildDayResults } from './day-result';
import { aChallenge, anAttempt } from './testing/domain-builders';

describe('day-result', () => {
  const challenge = aChallenge({ targetSeconds: 60 });
  const today = '2026-11-27'; // Day 12

  it('always returns 30 days', () => {
    expect(buildDayResults(challenge, [], today)).toHaveLength(30);
  });

  it('marks past days without attempts as missed, today as pending and later days as upcoming', () => {
    const days = buildDayResults(challenge, [], today);
    expect(days[10].status).toBe('missed'); // Day 11
    expect(days[11].status).toBe('pending'); // Day 12, today
    expect(days[12].status).toBe('upcoming'); // Day 13
  });

  it('BR-03: the best attempt of the day counts', () => {
    const attempts = [
      anAttempt(challenge, 3, 41),
      anAttempt(challenge, 3, 68),
      anAttempt(challenge, 3, 50),
    ];
    const day3 = buildDayResults(challenge, attempts, today)[2];
    expect(day3.bestSeconds).toBe(68);
    expect(day3.attemptCount).toBe(3);
  });

  it('BR-04: a day is complete when its best attempt reaches the target', () => {
    const attempts = [anAttempt(challenge, 1, 60), anAttempt(challenge, 2, 59)];
    const [day1, day2] = buildDayResults(challenge, attempts, today);
    expect(day1.status).toBe('complete');
    expect(day2.status).toBe('under-target');
  });

  it('BR-07: a day completed later is complete but not on time', () => {
    const makeUp = anAttempt(challenge, 4, 65, { recordedOnDay: 9 });
    const day4 = buildDayResults(challenge, [makeUp], today)[3];
    expect(day4.status).toBe('complete');
    expect(day4.completedOnTime).toBe(false);
    expect(day4.completedByMakeUp).toBe(true);
  });

  it('BR-07: a make-up does not change a day that was already complete on time', () => {
    const attempts = [
      anAttempt(challenge, 4, 61),
      anAttempt(challenge, 4, 70, { recordedOnDay: 9 }),
    ];
    const day4 = buildDayResults(challenge, attempts, today)[3];
    expect(day4.completedOnTime).toBe(true);
    expect(day4.completedByMakeUp).toBe(false);
  });

  it('BR-08: flags days that have a manual attempt', () => {
    const day5 = buildDayResults(
      challenge,
      [anAttempt(challenge, 5, 62, { source: 'manual' })],
      today,
    )[4];
    expect(day5.hasManualAttempt).toBe(true);
  });

  it('ignores attempts from another challenge', () => {
    const other = { ...aChallenge(), id: 'challenge-2' };
    const day1 = buildDayResults(challenge, [anAttempt(other, 1, 90)], today)[0];
    expect(day1.status).toBe('missed');
  });
});
