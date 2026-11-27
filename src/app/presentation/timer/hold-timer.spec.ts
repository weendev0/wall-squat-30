import { TestBed } from '@angular/core/testing';
import { FakeSoundPlayer } from '../../application/testing/fakes';
import { SOUND_PLAYER } from '../../composition/provide-wall-squat';
import { HoldTimer } from './hold-timer';

describe('HoldTimer', () => {
  let sound: FakeSoundPlayer;
  let timer: HoldTimer;

  beforeEach(() => {
    vi.useFakeTimers();
    sound = new FakeSoundPlayer();
    TestBed.configureTestingModule({
      providers: [HoldTimer, { provide: SOUND_PLAYER, useValue: sound }],
    });
    timer = TestBed.inject(HoldTimer);
  });

  afterEach(() => vi.useRealTimers());

  /** Runs the 3-second countdown so the hold is being timed. */
  function startHold(targetSeconds = 60): void {
    timer.start(targetSeconds);
    vi.advanceTimersByTime(3000);
    sound.played.length = 0;
  }

  it('beeps 3, 2, 1 and go, then starts timing', () => {
    timer.start(60);
    expect(timer.phase()).toBe('countdown');
    expect(timer.countdownSecondsLeft()).toBe(3);

    vi.advanceTimersByTime(3000);

    expect(sound.played).toEqual(['count', 'count', 'count', 'go']);
    expect(timer.phase()).toBe('running');
    expect(timer.elapsedSeconds()).toBe(0);
  });

  it('counts the hold in whole seconds and keeps counting past the target', () => {
    startHold(60);

    vi.advanceTimersByTime(75_400);

    expect(timer.elapsedSeconds()).toBe(75);
  });

  it('plays the 0:30 beep, three ticks and the final beep', () => {
    startHold(60);

    vi.advanceTimersByTime(61_000);

    expect(sound.played).toEqual(['halfway', 'tick', 'tick', 'tick', 'target']);
  });

  it('plays only the latest missed cue after the phone was asleep', () => {
    startHold(60);
    vi.advanceTimersByTime(10_000);

    // iOS paused the page: no updates ran, but the wall clock moved on 48 seconds.
    vi.setSystemTime(Date.now() + 48_000);
    vi.advanceTimersByTime(200);

    expect(timer.elapsedSeconds()).toBe(58);
    expect(sound.played).toEqual(['tick']);
  });

  it('returns the hold time on stop and stops updating', () => {
    startHold(60);
    vi.advanceTimersByTime(42_500);

    expect(timer.stop()).toBe(42);
    vi.advanceTimersByTime(10_000);

    expect(timer.phase()).toBe('stopped');
    expect(timer.elapsedSeconds()).toBe(42);
  });

  it('returns 0 when stopped during the countdown', () => {
    timer.start(60);
    vi.advanceTimersByTime(1000);

    expect(timer.stop()).toBe(0);
  });
});
