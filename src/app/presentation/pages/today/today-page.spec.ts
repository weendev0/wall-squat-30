import { TestBed } from '@angular/core/testing';
import {
  CheckInUseCase,
  RecordAttemptUseCase,
  StartChallengeUseCase,
  StartCheckOffChallengeUseCase,
} from '../../../application';
import { ChallengeStore } from '../../state/challenge-store';
import { openScreen, setUpApp } from '../../testing/screen-test-helpers';

describe('Today screen', () => {
  let fakes: ReturnType<typeof setUpApp>;
  let challengeId: string;

  beforeEach(async () => {
    fakes = setUpApp('2026-11-16');
    challengeId = (await TestBed.inject(StartChallengeUseCase).execute(60)).id;
  });

  it('shows the day, the target and the numbers of the challenge', async () => {
    fakes.clock.currentDate = '2026-11-17';
    await TestBed.inject(RecordAttemptUseCase).execute({
      challengeId,
      durationSeconds: 72,
      source: 'timer',
    });

    const screen = await openScreen('/today');

    expect(screen.text()).toContain('Exercise Day 2 of 30 Wall Squat');
    expect(screen.text()).toContain('Target 1:00 · best today 1:12 · 1 attempt');
    expect(screen.text()).toContain('Streak 1 day');
    expect(screen.text()).toContain('1/30 done');
    expect(screen.text()).toContain('1 of 1 done today');
  });

  it('unlocks sound inside the tap and opens the timer', async () => {
    const screen = await openScreen('/today');

    await screen.click('START');

    expect(fakes.sound.isUnlocked).toBe(true);
    expect(screen.currentUrl()).toBe(`/timer/${challengeId}`);
  });

  it('gives way to the Celebration screen once day 30 has passed', async () => {
    fakes.clock.currentDate = '2026-12-16';

    const screen = await openScreen('/today');

    expect(screen.currentUrl()).toBe(`/celebration/${challengeId}`);
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
    expect(screen.text()).toContain('0 of 30 days');

    await screen.click('History');
    expect(screen.currentUrl()).toBe('/history');
    expect(screen.text()).toContain('Hold time per day');
  });

  it('BR-13: shows a card for each running challenge and opens Check-in from it', async () => {
    const reading = await TestBed.inject(StartCheckOffChallengeUseCase).execute({
      name: 'Atomic Habits',
      category: 'reading',
    });

    const screen = await openScreen('/today');

    expect(screen.text()).toContain('Reading Day 1 of 30 Atomic Habits Not done yet today');
    expect(screen.text()).toContain('0 of 2 done today');

    await screen.click('Done');
    expect(screen.currentUrl()).toBe(`/check-in/${reading.id}`);
  });

  it('shows a check-off as done, with its note', async () => {
    const reading = await TestBed.inject(StartCheckOffChallengeUseCase).execute({
      name: 'Atomic Habits',
      category: 'reading',
    });
    await TestBed.inject(CheckInUseCase).execute({ challengeId: reading.id, note: 'Chapter 1' });

    const screen = await openScreen('/today');

    expect(screen.text()).toContain('Atomic Habits Chapter 1 Done ✓');
    expect(screen.text()).toContain('1 of 2 done today');
  });

  it('opens with only check-off challenges and no wall squat', async () => {
    await fakes.challenges.deleteAll();
    await TestBed.inject(StartCheckOffChallengeUseCase).execute({
      name: 'AWS exam prep',
      category: 'study',
    });

    const screen = await openScreen('/');

    expect(screen.currentUrl()).toBe('/today');
    expect(screen.text()).toContain('AWS exam prep');
    expect(screen.hasButton('START')).toBe(false);
  });

  it('closes the saved message', async () => {
    const screen = await openScreen('/today');
    await TestBed.inject(ChallengeStore).record({
      challengeId,
      durationSeconds: 40,
      source: 'timer',
    });
    await screen.harness.fixture.whenStable();
    expect(screen.text()).toContain('Saved 0:40 for Wall Squat.');

    await screen.click('✕');

    expect(screen.text()).not.toContain('Saved 0:40');
  });

  it('BR-16: shows a card with its own Start for each running timed challenge', async () => {
    const plank = await TestBed.inject(StartChallengeUseCase).execute(45, 'Plank');

    const screen = await openScreen('/today');

    expect(screen.text()).toContain('Day 1 of 30 Plank');
    expect(screen.text()).toContain('Target 0:45');
    expect(screen.text()).toContain('0 of 2 done today');
    await screen.click('Start Plank');
    expect(screen.currentUrl()).toBe(`/timer/${plank.id}`);
  });
});
