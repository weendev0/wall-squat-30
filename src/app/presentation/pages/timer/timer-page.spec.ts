import { TestBed } from '@angular/core/testing';
import { StartChallengeUseCase } from '../../../application';
import { AttemptDraftStore } from '../../state/attempt-draft-store';
import { openScreen, setUpApp } from '../../testing/screen-test-helpers';

describe('Timer screen', () => {
  let fakes: ReturnType<typeof setUpApp>;
  let challengeId: string;

  beforeEach(async () => {
    // Only the timer's own clock is faked; Angular keeps its real timers for rendering.
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    fakes = setUpApp('2026-11-16');
    challengeId = (await TestBed.inject(StartChallengeUseCase).execute(60)).id;
  });

  afterEach(() => vi.useRealTimers());

  async function openTimerAndHold(seconds: number) {
    const screen = await openScreen(`/timer/${challengeId}`);
    vi.advanceTimersByTime(3000 + seconds * 1000);
    await screen.harness.fixture.whenStable();
    return screen;
  }

  it('keeps the screen on and counts down before timing', async () => {
    const screen = await openScreen(`/timer/${challengeId}`);

    expect(fakes.wakeLock.isHeld).toBe(true);
    expect(screen.text()).toContain('Get ready 3');
    expect(screen.hasButton('STOP')).toBe(false);
  });

  it('shows the time and how long is left to the target', async () => {
    const screen = await openTimerAndHold(42);

    expect(screen.text()).toContain('0:42');
    expect(screen.text()).toContain('18s to target');
  });

  it('keeps counting after the target', async () => {
    const screen = await openTimerAndHold(75);

    expect(screen.text()).toContain('1:15');
    expect(screen.text()).toContain('Target reached · +0:15');
  });

  it('stops, lets the screen sleep again and opens Save attempt', async () => {
    const screen = await openTimerAndHold(61);

    await screen.click('STOP');

    expect(TestBed.inject(AttemptDraftStore).draft()).toEqual({
      challengeId,
      durationSeconds: 61,
      dayNumber: 1,
      targetSeconds: 60,
    });
    expect(screen.currentUrl()).toBe('/save-attempt');
    expect(fakes.wakeLock.isHeld).toBe(false);
  });

  it('goes back to Today without saving on Cancel', async () => {
    const screen = await openTimerAndHold(20);

    await screen.click('Cancel attempt');

    expect(screen.currentUrl()).toBe('/today');
    expect(TestBed.inject(AttemptDraftStore).draft()).toBeNull();
  });
});
