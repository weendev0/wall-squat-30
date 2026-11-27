import { createChallengeHistory } from '../../testing/challenge-history';
import { openScreen, setUpApp } from '../../testing/screen-test-helpers';

describe('Celebration screen', () => {
  let fakes: ReturnType<typeof setUpApp>;

  beforeEach(async () => {
    fakes = setUpApp();
    await createChallengeHistory(
      fakes,
      [
        { dayNumber: 1, durationSeconds: 62 },
        { dayNumber: 2, durationSeconds: 82 },
        { dayNumber: 3, durationSeconds: 61 },
        { dayNumber: 5, durationSeconds: 65 },
      ],
      31, // the day after day 30
    );
  });

  it('opens instead of Today once, right after day 30, with the final numbers', async () => {
    const screen = await openScreen('/today');

    expect(screen.currentUrl()).toBe('/celebration');
    expect(screen.text()).toContain('30 days done!');
    expect(screen.text()).toContain('Days complete 4/30');
    expect(screen.text()).toContain('Best hold 1:22');
    expect(screen.text()).toContain('Total time 4:30');
    expect(screen.text()).toContain('Longest streak 3 days');
  });

  it('is not shown again after starting a new challenge', async () => {
    const screen = await openScreen('/celebration');

    await screen.click('Start a new challenge');

    expect(screen.currentUrl()).toBe('/new-challenge');
    const [challenge] = await fakes.challenges.findAll();
    expect(challenge.celebrationShown).toBe(true);
  });

  it('can open the finished challenge in All sessions', async () => {
    const screen = await openScreen('/celebration');

    await screen.click('View this challenge in history');

    expect(screen.currentUrl()).toBe('/sessions?filter=past');
    expect(screen.text()).toContain('4 attempts over 4 days');
  });

  it('cannot be opened when no challenge has just finished', async () => {
    const screen = await openScreen('/celebration');
    await screen.click('Start a new challenge');

    await screen.harness.navigateByUrl('/celebration');

    expect(screen.currentUrl()).toBe('/new-challenge');
  });
});
