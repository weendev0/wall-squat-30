import { TestBed } from '@angular/core/testing';
import { StartChallengeUseCase } from '../../../application';
import { openScreen, setUpApp } from '../../testing/screen-test-helpers';

describe('New challenge screen', () => {
  let fakes: ReturnType<typeof setUpApp>;

  beforeEach(() => {
    fakes = setUpApp('2026-11-27');
  });

  it('opens from the empty Today when there is no challenge yet', async () => {
    const today = await openScreen('/');
    expect(today.currentUrl()).toBe('/today');
    expect(today.text()).toContain('No challenge is running yet.');

    await today.click('Start a new challenge');
    const screen = today;

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

  it('names a timed challenge "Wall squat" unless another name is typed', async () => {
    const screen = await openScreen('/new-challenge');
    const name = timedNameField(screen);
    expect(name.value).toBe('Wall squat');

    await typeName(screen, name, '  Plank  ');
    await screen.click('Start challenge');

    const [challenge] = await fakes.challenges.findAll();
    expect(challenge).toMatchObject({ kind: 'timed', name: 'Plank' });
    expect(screen.text()).toContain('Plank');
  });

  it('needs a name before a timed challenge can start', async () => {
    const screen = await openScreen('/new-challenge');

    await typeName(screen, timedNameField(screen), '   ');

    expect((screen.button('Start challenge') as HTMLButtonElement).disabled).toBe(true);
  });

  it('takes a target typed as minutes and seconds', async () => {
    const screen = await openScreen('/new-challenge');
    const [minutes, seconds] =
      screen.harness.routeNativeElement!.querySelectorAll<HTMLInputElement>(
        'app-duration-fields input',
      );

    minutes.value = '2';
    seconds.value = '15';
    seconds.dispatchEvent(new Event('change'));
    await screen.harness.fixture.whenStable();

    expect(screen.text()).toContain('2:15');
  });

  it('offers only a check-off while a wall squat is running', async () => {
    await TestBed.inject(StartChallengeUseCase).execute(60);

    const screen = await openScreen('/new-challenge');
    expect(
      screen
        .button('Daily check-off Tap Done once a day, with a note')
        .getAttribute('aria-checked'),
    ).toBe('true');

    await screen.click('Timed Hold for a target time, like the wall squat');
    expect(screen.text()).toContain('A timed challenge is already running.');
    expect((screen.button('Start challenge') as HTMLButtonElement).disabled).toBe(true);
  });

  it('BR-13: starts a Reading challenge with its name and opens Today', async () => {
    const screen = await openScreen('/new-challenge');

    await screen.click('Daily check-off Tap Done once a day, with a note');
    expect((screen.button('Start challenge') as HTMLButtonElement).disabled).toBe(true);

    await screen.click('Course');
    const name = screen.harness.routeNativeElement!.querySelector('input')!;
    name.value = 'Angular signals';
    name.dispatchEvent(new Event('input'));
    await screen.harness.fixture.whenStable();
    await screen.click('Start challenge');

    const [challenge] = await fakes.challenges.findAll();
    expect(challenge).toMatchObject({
      kind: 'checkoff',
      category: 'course',
      name: 'Angular signals',
    });
    expect(screen.currentUrl()).toBe('/today');
    expect(screen.text()).toContain('Angular signals');
  });
});

type Screen = Awaited<ReturnType<typeof openScreen>>;

function timedNameField(screen: Screen): HTMLInputElement {
  return screen.harness.routeNativeElement!.querySelector('.timed-name input')!;
}

async function typeName(screen: Screen, field: HTMLInputElement, text: string): Promise<void> {
  field.value = text;
  field.dispatchEvent(new Event('input'));
  await screen.harness.fixture.whenStable();
}
