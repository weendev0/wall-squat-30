import { createChallengeHistory } from '../../testing/challenge-history';
import { openScreen, setUpApp } from '../../testing/screen-test-helpers';

describe('Settings screen', () => {
  let fakes: ReturnType<typeof setUpApp>;

  beforeEach(async () => {
    fakes = setUpApp();
    await createChallengeHistory(fakes, [{ dayNumber: 1, durationSeconds: 65 }], 2);
  });

  it('opens from the gear on Today', async () => {
    const screen = await openScreen('/today');

    screen.harness
      .routeNativeElement!.querySelector<HTMLElement>('[aria-label="Settings"]')!
      .click();
    await screen.harness.fixture.whenStable();

    expect(screen.currentUrl()).toBe('/settings');
  });

  it('shares the history as a CSV file named with today', async () => {
    const screen = await openScreen('/settings');

    await screen.click('Export history (CSV)');

    const [file] = fakes.fileSharer.sharedFiles;
    expect(file.fileName).toBe('30-days-challenges-2026-11-17.csv');
    expect(file.text.split('\n')).toHaveLength(2); // header and one attempt
    expect(screen.text()).toContain('History exported.');
  });

  it('says nothing when the share sheet is closed', async () => {
    fakes.fileSharer.outcome = 'cancelled';
    const screen = await openScreen('/settings');

    await screen.click('Export history (CSV)');

    expect(screen.text()).not.toContain('History exported.');
  });

  it('asks before resetting, offers to export first, then deletes everything', async () => {
    const screen = await openScreen('/settings');

    await screen.click('Reset all history…');
    expect(screen.text()).toContain("This can't be undone.");

    await screen.click('Export first');
    expect(fakes.fileSharer.sharedFiles).toHaveLength(1);

    await screen.click('Reset');

    expect(fakes.challenges.items.size).toBe(0);
    expect(fakes.attempts.items.size).toBe(0);
    expect(screen.currentUrl()).toBe('/new-challenge');
  });

  it('keeps everything on Cancel', async () => {
    const screen = await openScreen('/settings');

    await screen.click('Reset all history…');
    await screen.click('Cancel');

    expect(screen.text()).not.toContain('Reset all history?');
    expect(fakes.attempts.items.size).toBe(1);
  });
});
