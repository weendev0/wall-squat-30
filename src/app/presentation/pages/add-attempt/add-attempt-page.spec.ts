import { createChallengeHistory } from '../../testing/challenge-history';
import { openScreen, setUpApp } from '../../testing/screen-test-helpers';

describe('Add attempt screen', () => {
  let fakes: ReturnType<typeof setUpApp>;

  beforeEach(async () => {
    fakes = setUpApp();
    await createChallengeHistory(
      fakes,
      [
        { dayNumber: 2, durationSeconds: 52 },
        { dayNumber: 4, durationSeconds: 68 },
      ],
      4,
    );
  });

  function dayOption(screen: Awaited<ReturnType<typeof openScreen>>, title: string): HTMLElement {
    const options =
      screen.harness.routeNativeElement!.querySelectorAll<HTMLElement>('[role="radio"]');
    return [...options].find((option) => option.textContent?.includes(title))!;
  }

  async function typeDuration(
    screen: Awaited<ReturnType<typeof openScreen>>,
    minutes: string,
    seconds: string,
  ) {
    const [minutesField, secondsField] =
      screen.harness.routeNativeElement!.querySelectorAll('input');
    minutesField.value = minutes;
    secondsField.value = seconds;
    secondsField.dispatchEvent(new Event('change'));
    await screen.harness.fixture.whenStable();
  }

  it('lists today first, then earlier days with what a save would mean', async () => {
    const screen = await openScreen('/add-attempt');

    expect(screen.text()).toContain('Day 4 · Today Best so far 1:08');
    expect(screen.text()).toContain('Day 3 · Wed 18 Nov Missed, will count as make-up');
    expect(screen.text()).toContain(
      'Day 2 · Tue 17 Nov Under target (0:52), will count as make-up',
    );
    expect(dayOption(screen, 'Day 4').getAttribute('aria-checked')).toBe('true');
  });

  it('preselects the day it was opened for', async () => {
    const screen = await openScreen('/add-attempt?day=3');

    expect(dayOption(screen, 'Day 3').getAttribute('aria-checked')).toBe('true');
  });

  it('saves a hand-typed make-up for an earlier day', async () => {
    const screen = await openScreen('/add-attempt');

    dayOption(screen, 'Day 3').click();
    await typeDuration(screen, '1', '05');
    await screen.click('Tough');
    await screen.click('Save');

    const saved = (await fakes.attempts.findAll()).find((attempt) => attempt.dayNumber === 3);
    expect(saved).toMatchObject({
      durationSeconds: 65,
      source: 'manual',
      isMakeUp: true,
      feeling: 'tough',
    });
    expect(screen.currentUrl()).toBe('/progress');
  });

  it('explains why a time cannot be saved', async () => {
    const screen = await openScreen('/add-attempt');

    await typeDuration(screen, '0', '3');
    await screen.click('Save');

    expect(screen.text()).toContain('Attempts under 5 seconds are not saved.');
    expect(screen.currentUrl()).toBe('/add-attempt');
  });

  it('goes back to Progress on Cancel', async () => {
    const screen = await openScreen('/add-attempt');

    await screen.click('Cancel');

    expect(screen.currentUrl()).toBe('/progress');
  });
});
