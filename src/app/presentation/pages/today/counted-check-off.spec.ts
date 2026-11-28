import { TestBed } from '@angular/core/testing';
import {
  AddCheckOffCategoryUseCase,
  CheckInUseCase,
  StartCheckOffChallengeUseCase,
} from '../../../application';
import { CheckOffChallenge } from '../../../domain';
import { waterFields } from '../../../domain/testing/domain-builders';
import { openScreen, setUpApp } from '../../testing/screen-test-helpers';

/** BR-22, BR-23: a counted challenge, such as 8 glasses of water, on Today and Check-in. */
describe('Counted check-off challenge', () => {
  let fakes: ReturnType<typeof setUpApp>;
  let water: CheckOffChallenge;

  beforeEach(async () => {
    fakes = setUpApp('2026-11-28');
    const category = await TestBed.inject(AddCheckOffCategoryUseCase).execute(waterFields());
    water = await TestBed.inject(StartCheckOffChallengeUseCase).execute({
      name: 'Water Drinking',
      customCategoryId: category.id,
    });
  });

  it('Today shows the count, and +1 glass adds one', async () => {
    const screen = await openScreen('/today');
    expect(screen.text()).toContain('💧 Water Drinking Day 1 of 30');
    expect(screen.text()).toContain('0 of 8 glasses');

    await screen.click('+1 glass');
    await screen.click('+1 glass');

    expect(screen.text()).toContain('2 of 8 glasses');
    expect((await fakes.checkIns.findAll())[0].count).toBe(2);
    expect(screen.text()).toContain('0 of 1 done today');
    expect(fakes.sound.played).toEqual([]);
  });

  it('reaching the goal plays the chime and marks the day done', async () => {
    await TestBed.inject(CheckInUseCase).execute({ challengeId: water.id, count: 7 });
    const screen = await openScreen('/today');

    await screen.click('+1 glass');

    expect(fakes.sound.played).toEqual(['chime']);
    expect(screen.text()).toContain('1 of 1 done today');
    expect(screen.text()).toContain('1/30 done');
  });

  it('Check-in counts with − and +, and saves the note with it', async () => {
    const screen = await openScreen(`/check-in/${water.id}`);
    expect(screen.text()).toContain('0 of 8 glasses');

    await screen.click('One more');
    await screen.click('One more');
    await screen.click('One more');
    await screen.click('One less');
    const textarea = screen.harness.routeNativeElement!.querySelector('textarea')!;
    textarea.value = 'Hot day';
    textarea.dispatchEvent(new Event('input'));
    await screen.click('Save');

    expect(await fakes.checkIns.findAll()).toMatchObject([{ count: 2, note: 'Hot day' }]);
    expect(screen.currentUrl()).toBe('/today');
  });

  it('saving a count of 0 removes the day', async () => {
    await TestBed.inject(CheckInUseCase).execute({ challengeId: water.id, count: 1 });
    const screen = await openScreen(`/check-in/${water.id}`);

    await screen.click('One less');
    await screen.click('Save');

    expect(await fakes.checkIns.findAll()).toEqual([]);
  });
});
