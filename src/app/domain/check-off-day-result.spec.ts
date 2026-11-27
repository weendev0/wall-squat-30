import { calculateProgress } from './challenge-progress';
import { buildCheckOffDayResults } from './day-result';
import { aCheckIn, aCheckOffChallenge } from './testing/domain-builders';

/** BR-14 to BR-18: a check-off challenge uses the same day results and streak rules as the wall squat. */
describe('check-off day results', () => {
  const challenge = aCheckOffChallenge(); // Day 1 = 16 Nov
  const today = '2026-11-20'; // Day 5

  it('always returns 30 days, without times', () => {
    const days = buildCheckOffDayResults(challenge, [], today);

    expect(days).toHaveLength(30);
    expect(days.every((day) => day.bestSeconds === null)).toBe(true);
  });

  it('BR-14: a day with a Done is complete; others are missed, pending or upcoming', () => {
    const days = buildCheckOffDayResults(challenge, [aCheckIn(challenge, 2)], today);

    expect(days.slice(0, 6).map((day) => day.status)).toEqual([
      'missed',
      'complete',
      'missed',
      'missed',
      'pending',
      'upcoming',
    ]);
  });

  it('BR-15: marks days that have a note', () => {
    const checkIns = [aCheckIn(challenge, 1, { note: 'Chapter 1' }), aCheckIn(challenge, 2)];
    const days = buildCheckOffDayResults(challenge, checkIns, today);

    expect(days[0].hasNote).toBe(true);
    expect(days[1].hasNote).toBe(false);
  });

  it('ignores check-ins of other challenges', () => {
    const other = { ...challenge, id: 'reading-2' };
    const days = buildCheckOffDayResults(challenge, [aCheckIn(other, 1)], today);

    expect(days[0].status).toBe('missed');
  });

  it('BR-17 and BR-18: a made-up day counts toward the 30 days but not the streak', () => {
    const checkIns = [
      aCheckIn(challenge, 1, { recordedOnDay: 4 }), // made up on day 4
      aCheckIn(challenge, 2),
      aCheckIn(challenge, 3),
      aCheckIn(challenge, 4),
    ];
    const days = buildCheckOffDayResults(challenge, checkIns, today);
    const progress = calculateProgress(days, [], today);

    expect(days[0]).toMatchObject({ status: 'complete', completedByMakeUp: true });
    expect(progress.daysComplete).toBe(4);
    expect(progress.currentStreak).toBe(3); // days 2 to 4; today (day 5) is still open
    expect(progress.daysToMakeUp).toEqual([]);
  });

  it('BR-17: lists missed past days so they can be made up', () => {
    const days = buildCheckOffDayResults(challenge, [aCheckIn(challenge, 2)], today);

    expect(calculateProgress(days, [], today).daysToMakeUp).toEqual([1, 3, 4]);
  });
});
