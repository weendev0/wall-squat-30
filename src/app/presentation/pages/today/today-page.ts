import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CHALLENGE_LENGTH_DAYS, DayResult } from '../../../domain';
import { SOUND_PLAYER } from '../../../composition/provide-wall-squat';
import { DurationPipe } from '../../shared/duration.pipe';
import { ChallengeStore } from '../../state/challenge-store';

const RECENT_DAY_COUNT = 7;

/** Screen 1: today's target, the key numbers and the big Start button. */
@Component({
  selector: 'app-today-page',
  imports: [DurationPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './today-page.html',
  styleUrl: './today-page.scss',
})
export class TodayPage {
  private readonly store = inject(ChallengeStore);
  private readonly sound = inject(SOUND_PLAYER);
  private readonly router = inject(Router);

  protected readonly challengeLength = CHALLENGE_LENGTH_DAYS;
  protected readonly overview = this.store.overview;
  protected readonly today = this.store.today;
  protected readonly savedNotice = this.store.savedNotice;

  /** The last 7 challenge days up to today, oldest first. */
  protected readonly recentDays = computed<DayResult[]>(() => {
    const overview = this.overview();
    const todayNumber = overview?.todayDayNumber ?? null;
    if (!overview || todayNumber === null) {
      return [];
    }
    return overview.days.slice(Math.max(0, todayNumber - RECENT_DAY_COUNT), todayNumber);
  });

  protected startHold(): void {
    // iOS only allows sound when it starts inside a tap, so unlock it here, before the timer.
    void this.sound.unlock();
    this.store.dismissSavedNotice();
    void this.router.navigate(['/timer']);
  }

  protected dismissNotice(): void {
    this.store.dismissSavedNotice();
  }
}
