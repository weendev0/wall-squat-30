import { TestBed } from '@angular/core/testing';
import { AddCheckOffCategoryUseCase, StartCheckOffChallengeUseCase } from '../../../application';
import { waterFields } from '../../../domain/testing/domain-builders';
import { openScreen, setUpApp } from '../../testing/screen-test-helpers';

type Screen = Awaited<ReturnType<typeof openScreen>>;

/** BR-21, BR-22, BR-24: adding and editing your own check-off categories on New challenge. */
describe('New challenge: your own check-off categories', () => {
  let fakes: ReturnType<typeof setUpApp>;

  beforeEach(() => {
    fakes = setUpApp('2026-11-28');
  });

  async function openCheckOff(): Promise<Screen> {
    const screen = await openScreen('/new-challenge');
    await screen.click('Daily check-off Tap Done once a day, with a note');
    return screen;
  }

  function type(screen: Screen, label: string, text: string): void {
    const field = screen.harness.routeNativeElement!.querySelector<HTMLInputElement>(
      `input[aria-label="${label}"]`,
    )!;
    field.value = text;
    field.dispatchEvent(new Event('input'));
  }

  it('BR-21: adds Water Drinking with 8 glasses, picks it and starts a challenge', async () => {
    const screen = await openCheckOff();

    await screen.click('+ Add category');
    expect(screen.text()).toContain('New category');
    type(screen, 'Category name', 'Water Drinking');
    await screen.click('Add category');

    expect(fakes.checkOffCategories.items).toMatchObject([
      { name: 'Water Drinking', tone: 'sky', icon: '💧', dailyGoal: 8, unit: 'glasses' },
    ]);
    expect(screen.button('💧 Water Drinking').getAttribute('aria-pressed')).toBe('true');
    expect(screen.text()).toContain('Goal: 8 glasses a day.');

    await screen.click('Start challenge');

    const [challenge] = await fakes.challenges.findAll();
    expect(challenge).toMatchObject({ name: 'Water Drinking', category: 'custom', dailyGoal: 8 });
    expect(screen.currentUrl()).toBe('/today');
  });

  it('BR-22: a Just Done category needs no goal', async () => {
    const screen = await openCheckOff();
    await screen.click('+ Add category');
    type(screen, 'Category name', 'Meditate');
    await screen.click('🧘');
    await screen.click('Just Done One tap a day');
    expect(screen.hasButton('Higher goal')).toBe(false);

    await screen.click('Add category');

    expect(fakes.checkOffCategories.items[0]).toMatchObject({ icon: '🧘', dailyGoal: 1, unit: '' });
  });

  it('BR-21: shows why a name cannot be used', async () => {
    const screen = await openCheckOff();
    await screen.click('+ Add category');
    type(screen, 'Category name', 'reading');

    await screen.click('Add category');

    expect(screen.text()).toContain('There is already a category called Reading.');
    expect(fakes.checkOffCategories.items).toEqual([]);
  });

  it('BR-24: edits a category of your own and deletes it when unused', async () => {
    await TestBed.inject(AddCheckOffCategoryUseCase).execute(waterFields());
    const screen = await openCheckOff();

    await screen.click('💧 Water Drinking');
    await screen.click('Edit Water Drinking');
    type(screen, 'Category name', 'Water');
    await screen.click('Save category');
    expect(fakes.checkOffCategories.items[0].name).toBe('Water');

    await screen.click('Edit Water');
    await screen.click('Delete category');
    expect(fakes.checkOffCategories.items).toEqual([]);
    expect(screen.button('Reading').getAttribute('aria-pressed')).toBe('true');
  });

  it('BR-24: a category used by a challenge cannot be deleted', async () => {
    const water = await TestBed.inject(AddCheckOffCategoryUseCase).execute(waterFields());
    await TestBed.inject(StartCheckOffChallengeUseCase).execute({
      name: 'Water',
      customCategoryId: water.id,
    });
    const screen = await openCheckOff();

    await screen.click('💧 Water Drinking');
    await screen.click('Edit Water Drinking');

    expect(screen.hasButton('Delete category')).toBe(false);
    expect(screen.text()).toContain('A challenge uses this category');
  });
});
