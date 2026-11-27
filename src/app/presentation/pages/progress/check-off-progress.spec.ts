import { TestBed } from '@angular/core/testing';
import {
  CheckInUseCase,
  StartChallengeUseCase,
  StartCheckOffChallengeUseCase,
} from '../../../application';
import { CheckOffChallenge } from '../../../domain';
import { openScreen, setUpApp } from '../../testing/screen-test-helpers';

/** Progress and History with a Reading challenge next to the wall squat (canvas board 15). */
describe('Progress and History of a check-off challenge', () => {
  let fakes: ReturnType<typeof setUpApp>;
  let reading: CheckOffChallenge;

  beforeEach(async () => {
    fakes = setUpApp('2026-11-23');
    await TestBed.inject(StartChallengeUseCase).execute(60);
    reading = await TestBed.inject(StartCheckOffChallengeUseCase).execute({
      name: 'Atomic Habits',
      category: 'reading',
    });
    const checkIn = TestBed.inject(CheckInUseCase);
    for (const [date, note] of [
      ['2026-11-24', 'Chapter 1'],
      ['2026-11-25', ''],
      ['2026-11-26', 'Make the cue obvious'],
    ]) {
      fakes.clock.currentDate = date;
      await checkIn.execute({ challengeId: reading.id, note });
    }
    fakes.clock.currentDate = '2026-11-27'; // Day 5; day 1 was missed
  });

  it('shows a tab per challenge, with the wall squat first', async () => {
    const screen = await openScreen('/progress');

    expect(screen.hasButton('Wall squat')).toBe(true);
    expect(screen.hasButton('Atomic Habits')).toBe(true);
    expect(screen.text()).toContain('Wall squat · started Mon 23 Nov');
  });

  it('switches to the Reading grid with done, missed and note marks', async () => {
    const screen = await openScreen('/progress');

    await screen.click('Atomic Habits');

    expect(screen.currentUrl()).toBe(`/progress?challenge=${reading.id}`);
    expect(screen.text()).toContain('3 of 30 days 27 to go');
    expect(screen.text()).toContain('Current streak 3 days · 1 missed');
    const day2 = screen.harness.routeNativeElement!.querySelector('[aria-label^="Day 2,"]');
    expect(day2?.getAttribute('aria-label')).toBe('Day 2, done, has a note');
  });

  it('BR-17: offers to make up the missed day on Check-in', async () => {
    const screen = await openScreen(`/progress?challenge=${reading.id}`);

    expect(screen.text()).toContain('Day 1 was missed');
    await screen.click('Make up');

    expect(screen.currentUrl()).toBe(`/check-in/${reading.id}?day=1`);
  });

  it('BR-15: lists every Done with its note in History, newest first', async () => {
    const screen = await openScreen(`/history?challenge=${reading.id}`);

    expect(screen.text()).toContain('Days done 3/30 Longest streak 3 Notes 2');
    expect(screen.text()).toContain(
      'Day 4 · Thu 26 Nov Make the cue obvious Day 3 · Wed 25 Nov Done, no note Day 2 · Tue 24 Nov Chapter 1',
    );
  });

  it('BR-18: celebrates a finished check-off challenge once, then shows its notes', async () => {
    fakes.clock.currentDate = '2026-12-23'; // the day after its day 30 (the wall squat too)
    await fakes.challenges.save({
      ...(await fakes.challenges.findAll()).find((c) => c.kind === 'timed')!,
      celebrationShown: true,
      status: 'completed',
      completedOn: '2026-12-23',
    });

    const screen = await openScreen('/today');
    expect(screen.currentUrl()).toBe(`/celebration/${reading.id}`);
    expect(screen.text()).toContain('You finished Atomic Habits.');
    expect(screen.text()).toContain('Days done 3/30');

    await screen.click('View this challenge in history');
    expect(screen.currentUrl()).toBe(`/history?challenge=${reading.id}`);
    expect(screen.text()).toContain('Atomic Habits History Days done 3/30');
    expect(screen.text()).toContain('Chapter 1');

    await screen.click('Today');
    expect(screen.text()).toContain('No challenge is running yet.');
  });
});
