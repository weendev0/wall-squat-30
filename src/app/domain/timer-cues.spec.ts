import { countdownCueFor, cuePlanFor, cuesBetween } from './timer-cues';

describe('timer-cues (spec section 4)', () => {
  it('plans a beep at 0:30, ticks at 0:57 to 0:59 and the final beep at 1:00', () => {
    expect(cuePlanFor(60)).toEqual([
      { atSecond: 30, cue: 'halfway' },
      { atSecond: 57, cue: 'tick' },
      { atSecond: 58, cue: 'tick' },
      { atSecond: 59, cue: 'tick' },
      { atSecond: 60, cue: 'target' },
    ]);
  });

  it('skips the 0:30 beep when the target is 30 seconds or less', () => {
    expect(cuePlanFor(20).map((c) => c.cue)).toEqual(['tick', 'tick', 'tick', 'target']);
  });

  it('never plays a tick on top of the 0:30 beep', () => {
    expect(cuePlanFor(31).filter((c) => c.atSecond === 30)).toEqual([
      { atSecond: 30, cue: 'halfway' },
    ]);
  });

  it('plays each cue once as time moves on', () => {
    expect(cuesBetween(29, 30, 60)).toEqual(['halfway']);
    expect(cuesBetween(30, 31, 60)).toEqual([]);
    expect(cuesBetween(59, 60, 60)).toEqual(['target']);
  });

  it('plays nothing after the target while the timer keeps counting', () => {
    expect(cuesBetween(60, 75, 60)).toEqual([]);
  });

  it('plays only the latest missed cue after the phone was asleep', () => {
    expect(cuesBetween(10, 58, 60)).toEqual(['tick']);
  });

  it('beeps 3, 2, 1 and then go before the timer starts', () => {
    expect([5, 3, 2, 1, 0].map(countdownCueFor)).toEqual([null, 'count', 'count', 'count', 'go']);
  });
});
