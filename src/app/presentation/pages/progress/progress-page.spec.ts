import { createChallengeHistory } from '../../testing/challenge-history';
import { openScreen, setUpApp } from '../../testing/screen-test-helpers';

describe('Progress screen', () => {
  let fakes: ReturnType<typeof setUpApp>;

  beforeEach(() => {
    fakes = setUpApp();
  });

  function cell(screen: Awaited<ReturnType<typeof openScreen>>, dayNumber: number): HTMLElement {
    const cells = screen.harness.routeNativeElement!.querySelectorAll<HTMLElement>('.grid li');
    return cells[dayNumber - 1];
  }

  it("shows today's result when the target was hit", async () => {
    await createChallengeHistory(fakes, [{ dayNumber: 3, durationSeconds: 74 }], 3);

    const screen = await openScreen('/progress');

    expect(screen.text()).toContain('Wall Squat · started Mon 16 Nov');
    expect(screen.text()).toContain('Target hit. Day 3 done. 1:14 +14s over target');
  });

  it('counts complete, short and missed days', async () => {
    await createChallengeHistory(
      fakes,
      [
        { dayNumber: 1, durationSeconds: 61 },
        { dayNumber: 2, durationSeconds: 45 },
        { dayNumber: 4, durationSeconds: 60 },
      ],
      5,
    );

    const screen = await openScreen('/progress');

    expect(screen.text()).toContain('2 of 30 days 28 to go');
    expect(screen.text()).toContain('Current streak 1 day · 1 short day · 1 missed');
  });

  it('colours each day and marks made-up and hand-added days', async () => {
    await createChallengeHistory(
      fakes,
      [
        { dayNumber: 1, durationSeconds: 65 },
        { dayNumber: 2, durationSeconds: 70, source: 'manual', savedDaysLater: 2 },
      ],
      4,
    );

    const screen = await openScreen('/progress');

    expect(cell(screen, 1).className).toContain('complete');
    expect(cell(screen, 2).getAttribute('aria-label')).toBe('Day 2, 1:10, made up');
    expect(cell(screen, 2).querySelector('.made-up')).not.toBeNull();
    expect(cell(screen, 2).querySelector('.manual')).not.toBeNull();
    expect(cell(screen, 3).className).toContain('missed');
    expect(cell(screen, 4).className).toContain('today');
    expect(cell(screen, 5).className).toContain('upcoming');
  });

  it('suggests making up the earliest unfinished day', async () => {
    const challenge = await createChallengeHistory(
      fakes,
      [
        { dayNumber: 1, durationSeconds: 50 },
        { dayNumber: 3, durationSeconds: 61 },
      ],
      4,
    );

    const screen = await openScreen('/progress');
    expect(screen.text()).toContain('Day 1 was under target (0:50)');

    await screen.click('Make up');
    expect(screen.currentUrl()).toBe(`/add-attempt/${challenge.id}?day=1`);
  });

  it('offers no make-up when every past day is done', async () => {
    await createChallengeHistory(fakes, [{ dayNumber: 1, durationSeconds: 60 }], 2);

    const screen = await openScreen('/progress');

    expect(screen.hasButton('Make up')).toBe(false);
  });
});
