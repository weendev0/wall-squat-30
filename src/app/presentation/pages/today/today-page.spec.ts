import { TestBed } from '@angular/core/testing';
import { RecordAttemptUseCase, StartChallengeUseCase } from '../../../application';
import { ChallengeStore } from '../../state/challenge-store';
import { openScreen, setUpApp } from '../../testing/screen-test-helpers';

describe('Today screen', () => {
  let fakes: ReturnType<typeof setUpApp>;

  beforeEach(async () => {
    fakes = setUpApp('2026-11-16');
    await TestBed.inject(StartChallengeUseCase).execute(60);
  });

  it('shows the day, the target and the numbers of the challenge', async () => {
    fakes.clock.currentDate = '2026-11-17';
    await TestBed.inject(RecordAttemptUseCase).execute({
      durationSeconds: 72,
      source: 'timer',
    });

    const screen = await openScreen('/today');

    expect(screen.text()).toContain('Day 2 of 30');
    expect(screen.text()).toContain("Today's target 1:00");
    expect(screen.text()).toContain('Best hold 1:12');
    expect(screen.text()).toContain('Completed 1/30');
    expect(screen.text()).toContain("Today's best 1:12 · 1 attempt");
  });

  it('unlocks sound inside the tap and opens the timer', async () => {
    const screen = await openScreen('/today');

    await screen.click('START');

    expect(fakes.sound.isUnlocked).toBe(true);
    expect(screen.currentUrl()).toBe('/timer');
  });

  it('offers a new challenge once day 30 has passed', async () => {
    fakes.clock.currentDate = '2026-12-16';

    const screen = await openScreen('/today');

    expect(screen.text()).toContain('Challenge finished');
    await screen.click('Start a new challenge');
    expect(screen.currentUrl()).toBe('/new-challenge');
  });

  it('shows the tab bar with Progress and History', async () => {
    const screen = await openScreen('/today');
    const tabs = screen.harness.fixture.nativeElement.querySelectorAll('nav a');

    expect([...tabs].map((tab) => (tab as HTMLElement).textContent?.trim())).toEqual([
      'Today',
      'Progress',
      'History',
    ]);
  });

  it('opens Progress and History from the tab bar', async () => {
    const screen = await openScreen('/today');

    await screen.click('Progress');
    expect(screen.currentUrl()).toBe('/progress');
    expect(screen.text()).toContain('This screen is coming in the next update.');

    await screen.click('History');
    expect(screen.currentUrl()).toBe('/history');
  });

  it('closes the saved message', async () => {
    const screen = await openScreen('/today');
    await TestBed.inject(ChallengeStore).record({ durationSeconds: 40, source: 'timer' });
    await screen.harness.fixture.whenStable();
    expect(screen.text()).toContain('Saved 0:40.');

    await screen.click('✕');

    expect(screen.text()).not.toContain('Saved 0:40.');
  });
});
