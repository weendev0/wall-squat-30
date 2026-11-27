import { createChallengeHistory } from '../../testing/challenge-history';
import { openScreen, setUpApp } from '../../testing/screen-test-helpers';

describe('History screen', () => {
  let fakes: ReturnType<typeof setUpApp>;

  beforeEach(() => {
    fakes = setUpApp();
  });

  it('shows the totals of the challenge', async () => {
    await createChallengeHistory(
      fakes,
      [
        { dayNumber: 1, durationSeconds: 45 },
        { dayNumber: 2, durationSeconds: 74 },
        { dayNumber: 2, durationSeconds: 61 },
      ],
      2,
    );

    const screen = await openScreen('/history');

    expect(screen.text()).toContain('Total time 3:00');
    expect(screen.text()).toContain('Best hold 1:14');
    expect(screen.text()).toContain('Average 1:00');
  });

  it('draws one bar per day so far, coloured by result, with the target line', async () => {
    await createChallengeHistory(
      fakes,
      [
        { dayNumber: 1, durationSeconds: 40 },
        { dayNumber: 2, durationSeconds: 80 },
      ],
      3,
    );

    const screen = await openScreen('/history');
    const root = screen.harness.routeNativeElement!;
    const bars = [...root.querySelectorAll<HTMLElement>('.bar')];

    expect(bars.map((bar) => bar.className)).toEqual([
      'bar under-target',
      'bar complete',
      'bar pending',
    ]);
    expect(bars[1].style.height).toBe('100%'); // 80 s is the top of an 80 s chart
    expect(bars[0].style.height).toBe('50%');
    expect(root.querySelector<HTMLElement>('.target-line')!.style.bottom).toBe('75%');
    expect(screen.text()).toContain('dashed line = 1:00 target');
  });

  it('lists the latest holds with feeling, best hold and icons', async () => {
    await createChallengeHistory(
      fakes,
      [
        { dayNumber: 1, durationSeconds: 62, feeling: 'easy' },
        { dayNumber: 2, durationSeconds: 74, feeling: 'solid' },
        { dayNumber: 3, durationSeconds: 50, source: 'manual', savedDaysLater: 1 },
      ],
      4,
    );

    const screen = await openScreen('/history');
    const rows = [...screen.harness.routeNativeElement!.querySelectorAll('.recent-row')];
    const iconsOf = (row: Element) =>
      [...row.querySelectorAll('[aria-label]')].map((icon) => icon.getAttribute('aria-label'));

    expect(rows.map((row) => row.querySelector('strong')!.textContent)).toEqual([
      'Day 3 · Wed 18 Nov',
      'Day 2 · Tue 17 Nov',
      'Day 1 · Mon 16 Nov',
    ]);
    expect(rows[0].textContent).toContain('0:50');
    expect(iconsOf(rows[0])).toEqual(['Make-up', 'Added by hand']);
    expect(rows[1].textContent).toContain('Solid · best hold');
    expect(rows[2].textContent).toContain('Easy');
    expect(iconsOf(rows[2])).toEqual([]);
  });

  it('says so when there are no holds yet', async () => {
    await createChallengeHistory(fakes, [], 1);

    const screen = await openScreen('/history');

    expect(screen.text()).toContain('No holds yet.');
  });
});
