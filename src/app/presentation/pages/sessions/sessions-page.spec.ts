import { TestBed } from '@angular/core/testing';
import {
  GetChallengeOverviewUseCase,
  StartChallengeUseCase,
  RecordAttemptUseCase,
} from '../../../application';
import { createChallengeHistory } from '../../testing/challenge-history';
import { openScreen, setUpApp } from '../../testing/screen-test-helpers';

describe('All sessions screen', () => {
  let fakes: ReturnType<typeof setUpApp>;

  beforeEach(() => {
    fakes = setUpApp();
  });

  function dayCards(screen: Awaited<ReturnType<typeof openScreen>>): HTMLElement[] {
    return [...screen.harness.routeNativeElement!.querySelectorAll<HTMLElement>('.day')];
  }

  it('lists every attempt grouped by day, newest day first', async () => {
    await createChallengeHistory(
      fakes,
      [
        { dayNumber: 1, durationSeconds: 41, feeling: 'tough' },
        { dayNumber: 1, durationSeconds: 65, feeling: 'solid', note: 'great' },
        { dayNumber: 3, durationSeconds: 70, source: 'manual', savedDaysLater: 1 },
      ],
      4,
    );

    const screen = await openScreen('/sessions');
    const [day3, day1] = dayCards(screen);

    expect(screen.text()).toContain(
      'Started Mon 16 Nov · target 1:00 · 3 attempts over 2 days · 1 missed',
    );
    expect(day3.textContent).toContain('Day 3 · Wed 18 Nov');
    expect(day3.textContent).toContain('made up on Thu 19 Nov · added by hand');
    expect(day1.textContent).toContain('Best 1:05');
    expect(day1.textContent).toContain('Solid · great');
    expect(day1.querySelectorAll('.attempt')).toHaveLength(2);
  });

  it('deletes an attempt only after it is confirmed', async () => {
    await createChallengeHistory(
      fakes,
      [
        { dayNumber: 1, durationSeconds: 41 },
        { dayNumber: 1, durationSeconds: 65 },
      ],
      1,
    );
    const screen = await openScreen('/sessions');

    await screen.click('🗑');
    expect(screen.text()).toContain('Delete 1:05?');
    await screen.click('Keep');
    expect(fakes.attempts.items.size).toBe(2);

    await screen.click('🗑');
    await screen.click('Delete');

    expect([...fakes.attempts.items.values()].map((a) => a.durationSeconds)).toEqual([41]);
    expect(screen.text()).toContain('Best 0:41');
    const overview = await TestBed.inject(GetChallengeOverviewUseCase).execute();
    expect(overview?.days[0].status).toBe('under-target');
  });

  it('filters between this challenge, past challenges and all time', async () => {
    await createChallengeHistory(fakes, [{ dayNumber: 2, durationSeconds: 62 }], 31);
    await TestBed.inject(GetChallengeOverviewUseCase).execute(); // finishes the first challenge
    await TestBed.inject(StartChallengeUseCase).execute(90);
    await TestBed.inject(RecordAttemptUseCase).execute({ durationSeconds: 95, source: 'timer' });

    const screen = await openScreen('/sessions?filter=past');
    expect(screen.text()).toContain('target 1:00');
    expect(screen.text()).not.toContain('target 1:30');

    await screen.click('This challenge');
    expect(screen.text()).toContain('target 1:30');
    expect(screen.text()).not.toContain('target 1:00');

    await screen.click('All time');
    expect(dayCards(screen)).toHaveLength(2);
  });

  it('says so when there is nothing to show', async () => {
    const screen = await openScreen('/sessions?filter=past');

    expect(screen.text()).toContain('Nothing to show here yet.');
  });
});
