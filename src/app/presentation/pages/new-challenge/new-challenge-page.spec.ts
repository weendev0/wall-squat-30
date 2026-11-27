import { TestBed } from '@angular/core/testing';
import { StartChallengeUseCase } from '../../../application';
import { openScreen, setUpApp } from '../../testing/screen-test-helpers';

describe('New challenge screen', () => {
  let fakes: ReturnType<typeof setUpApp>;

  beforeEach(() => {
    fakes = setUpApp('2026-11-27');
  });

  it('opens first when there is no challenge yet', async () => {
    const screen = await openScreen('/');

    expect(screen.currentUrl()).toBe('/new-challenge');
    expect(screen.text()).toContain('30 days, starting today, Fri 27 Nov');
    expect(screen.text()).toContain('1:00');
  });

  it('changes the target in 5 second steps and with presets', async () => {
    const screen = await openScreen('/new-challenge');

    await screen.click('+5s');
    expect(screen.text()).toContain('1:05');

    await screen.click('1:30');
    expect(screen.button('1:30').getAttribute('aria-pressed')).toBe('true');
  });

  it('starts a challenge with the chosen target and opens Today', async () => {
    const screen = await openScreen('/new-challenge');

    await screen.click('−5s');
    await screen.click('Start challenge');

    const [challenge] = await fakes.challenges.findAll();
    expect(challenge).toMatchObject({ kind: 'timed', targetSeconds: 55 });
    expect(challenge.startDate).toBe('2026-11-27');
    expect(screen.currentUrl()).toBe('/today');
  });

  it('takes a target typed as minutes and seconds', async () => {
    const screen = await openScreen('/new-challenge');
    const [minutes, seconds] = screen.harness.routeNativeElement!.querySelectorAll('input');

    minutes.value = '2';
    seconds.value = '15';
    seconds.dispatchEvent(new Event('change'));
    await screen.harness.fixture.whenStable();

    expect(screen.text()).toContain('2:15');
  });

  it('goes to Today when a challenge is already running', async () => {
    await TestBed.inject(StartChallengeUseCase).execute(60);

    const screen = await openScreen('/new-challenge');

    expect(screen.currentUrl()).toBe('/today');
  });
});
