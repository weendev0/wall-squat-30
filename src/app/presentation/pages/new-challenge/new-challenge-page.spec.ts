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

  it('BR-15: offers Wall Squat first and starts it by default', async () => {
    const screen = await openScreen('/new-challenge');

    expect(screen.button('Wall Squat').getAttribute('aria-pressed')).toBe('true');
    await screen.click('Start challenge');

    const [challenge] = await fakes.challenges.findAll();
    expect(challenge).toMatchObject({ kind: 'timed', name: 'Wall Squat' });
  });

  it('BR-15: adds a category, picks it and keeps it for next time', async () => {
    const screen = await openScreen('/new-challenge');

    await addCategory(screen, '  Plank ');

    expect(screen.button('Plank').getAttribute('aria-pressed')).toBe('true');
    expect(fakes.categories.items.map((category) => category.name)).toEqual(['Plank']);
    await screen.click('Start challenge');
    const [challenge] = await fakes.challenges.findAll();
    expect(challenge).toMatchObject({ kind: 'timed', name: 'Plank' });

    await screen.harness.navigateByUrl('/new-challenge');
    await screen.harness.fixture.whenStable();
    expect(screen.hasButton('Plank · running')).toBe(true);
  });

  it('BR-16: a running category cannot start again, but another one can', async () => {
    await TestBed.inject(StartChallengeUseCase).execute(60);

    const screen = await openScreen('/new-challenge');
    expect((screen.button('Wall Squat · running') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.button('Start challenge') as HTMLButtonElement).disabled).toBe(true);

    await addCategory(screen, 'Plank');
    await screen.click('Start challenge');

    const names = (await fakes.challenges.findAll()).map((challenge) => challenge.name);
    expect(names).toContain('Plank');
    expect(screen.currentUrl()).toBe('/today');
  });

  it('BR-16: says so when the added category is already running', async () => {
    await TestBed.inject(StartChallengeUseCase).execute(60);
    const screen = await openScreen('/new-challenge');

    await addCategory(screen, 'wall squat');

    expect(screen.text()).toContain('Wall Squat is already running. Pick another category.');
    expect((screen.button('Start challenge') as HTMLButtonElement).disabled).toBe(true);
  });
});

type Screen = Awaited<ReturnType<typeof openScreen>>;

async function addCategory(screen: Screen, name: string): Promise<void> {
  await screen.click('+ Add category');
  const field = screen.harness.routeNativeElement!.querySelector<HTMLInputElement>(
    'input[aria-label="New category name"]',
  )!;
  field.value = name;
  field.dispatchEvent(new Event('input'));
  await screen.harness.fixture.whenStable();
  await screen.click('Add');
}
