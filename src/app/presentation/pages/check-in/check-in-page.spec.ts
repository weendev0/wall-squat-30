import { TestBed } from '@angular/core/testing';
import { CheckInUseCase, StartCheckOffChallengeUseCase } from '../../../application';
import { CheckOffChallenge } from '../../../domain';
import { openScreen, setUpApp } from '../../testing/screen-test-helpers';

describe('Check-in screen', () => {
  let fakes: ReturnType<typeof setUpApp>;
  let reading: CheckOffChallenge;

  beforeEach(async () => {
    fakes = setUpApp('2026-11-23');
    reading = await TestBed.inject(StartCheckOffChallengeUseCase).execute({
      name: 'Atomic Habits',
      category: 'reading',
    });
    fakes.clock.currentDate = '2026-11-27'; // Day 5
  });

  function typeNote(screen: Awaited<ReturnType<typeof openScreen>>, text: string) {
    const textarea = screen.harness.routeNativeElement!.querySelector('textarea')!;
    textarea.value = text;
    textarea.dispatchEvent(new Event('input'));
  }

  it("shows the challenge and today's day", async () => {
    const screen = await openScreen(`/check-in/${reading.id}`);

    expect(screen.text()).toContain('Reading Day 5 of 30 · Fri 27 Nov');
    expect(screen.text()).toContain('Atomic Habits');
  });

  it('BR-14, BR-15, BR-16: Done plays the chime, then Save stores it with the note', async () => {
    const screen = await openScreen(`/check-in/${reading.id}`);

    await screen.click('Done');
    expect(fakes.sound.isUnlocked).toBe(true);
    expect(fakes.sound.played).toEqual(['chime']);
    expect(screen.text()).toContain('Done!');

    typeNote(screen, 'Make the cue obvious');
    await screen.click('Save');

    const [checkIn] = await fakes.checkIns.findAll();
    expect(checkIn).toMatchObject({ dayNumber: 5, note: 'Make the cue obvious', isMakeUp: false });
    expect(screen.currentUrl()).toBe('/today');
  });

  it('opens an already done day with its note, and tapping again undoes it', async () => {
    await TestBed.inject(CheckInUseCase).execute({ challengeId: reading.id, note: 'Chapter 3' });

    const screen = await openScreen(`/check-in/${reading.id}`);
    expect(screen.text()).toContain('Done!');
    expect(screen.harness.routeNativeElement!.querySelector('textarea')!.value).toBe('Chapter 3');

    await screen.click('Done!');
    await screen.click('Save');

    expect(await fakes.checkIns.findAll()).toEqual([]);
  });

  it('BR-17: makes up an earlier day and goes back to Progress', async () => {
    const screen = await openScreen(`/check-in/${reading.id}?day=1`);
    expect(screen.text()).toContain('Day 1 of 30 · Mon 23 Nov · make-up');

    await screen.click('Done');
    await screen.click('Save');

    const [checkIn] = await fakes.checkIns.findAll();
    expect(checkIn).toMatchObject({ dayNumber: 1, isMakeUp: true });
    expect(screen.currentUrl()).toBe(`/progress?challenge=${reading.id}`);
  });

  it('goes to Today for a challenge that does not exist', async () => {
    const screen = await openScreen('/check-in/missing');

    expect(screen.currentUrl()).toBe('/today');
  });
});
