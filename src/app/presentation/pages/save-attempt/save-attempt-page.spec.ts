import { TestBed } from '@angular/core/testing';
import { StartChallengeUseCase } from '../../../application';
import { AttemptDraftStore } from '../../state/attempt-draft-store';
import { openScreen, setUpApp } from '../../testing/screen-test-helpers';

describe('Save attempt screen', () => {
  let fakes: ReturnType<typeof setUpApp>;
  let challengeId: string;

  beforeEach(async () => {
    fakes = setUpApp('2026-11-16');
    challengeId = (await TestBed.inject(StartChallengeUseCase).execute(60)).id;
  });

  function stoppedAt(durationSeconds: number): void {
    TestBed.inject(AttemptDraftStore).set({
      challengeId,
      durationSeconds,
      dayNumber: 1,
      targetSeconds: 60,
    });
  }

  it('saves the hold with its feeling and note, then shows it on Today', async () => {
    stoppedAt(64);
    const screen = await openScreen('/save-attempt');
    expect(screen.text()).toContain('Target 1:00 reached');

    await screen.click('Solid');
    const note = screen.harness.routeNativeElement!.querySelector('textarea')!;
    note.value = 'Felt strong';
    note.dispatchEvent(new Event('input'));
    await screen.click('Save');

    const [attempt] = await fakes.attempts.findAll();
    expect(attempt).toMatchObject({
      durationSeconds: 64,
      dayNumber: 1,
      source: 'timer',
      feeling: 'solid',
      note: 'Felt strong',
    });
    expect(screen.currentUrl()).toBe('/today');
    expect(screen.text()).toContain('Saved 1:04 for Wall Squat. New personal best!');
  });

  it('says how far a hold was from the target', async () => {
    stoppedAt(48);

    const screen = await openScreen('/save-attempt');

    expect(screen.text()).toContain('12s short of the 1:00 target');
  });

  it('throws the hold away on Discard', async () => {
    stoppedAt(48);
    const screen = await openScreen('/save-attempt');

    await screen.click('Discard');

    expect(await fakes.attempts.findAll()).toEqual([]);
    expect(screen.currentUrl()).toBe('/today');
  });

  it('never saves a hold under 5 seconds and offers to try again', async () => {
    stoppedAt(3);
    const screen = await openScreen('/save-attempt');

    expect(screen.text()).toContain('Under 5 seconds, so this one was not saved.');
    expect(screen.hasButton('Save')).toBe(false);

    await screen.click('Try again');
    expect(fakes.sound.isUnlocked).toBe(true);
    expect(screen.currentUrl()).toBe(`/timer/${challengeId}`);
  });

  it('cannot be opened without a stopped hold', async () => {
    const screen = await openScreen('/save-attempt');

    expect(screen.currentUrl()).toBe('/today');
  });
});
