import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CheckOffOverview } from '../../../application';
import { formatDuration } from '../../../domain';
import { CLOCK, SOUND_PLAYER } from '../../../composition/provide-wall-squat';
import { ChallengeCard } from '../../shared/challenge-card';
import { shortDateLabel } from '../../shared/date-label';
import { DurationPipe } from '../../shared/duration.pipe';
import { ChallengeStore } from '../../state/challenge-store';
import { CheckOffStore } from '../../state/check-off-store';

/** A Reading, Course or Study card, ready to show. */
interface CheckOffCard {
  readonly overview: CheckOffOverview;
  readonly dayNumber: number;
  readonly isDoneToday: boolean;
  readonly detail: string;
}

/**
 * Screens 1 and 12: every running challenge, each on its own card (BR-13).
 * The wall squat card starts the timer; a check-off card opens Check-in.
 */
@Component({
  selector: 'app-today-page',
  imports: [ChallengeCard, DurationPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './today-page.html',
  styleUrl: './today-page.scss',
})
export class TodayPage {
  private readonly challengeStore = inject(ChallengeStore);
  private readonly checkOffStore = inject(CheckOffStore);
  private readonly sound = inject(SOUND_PLAYER);
  private readonly router = inject(Router);

  protected readonly dateLabel = shortDateLabel(inject(CLOCK).today());
  protected readonly wallSquat = this.challengeStore.overview;
  protected readonly wallSquatToday = this.challengeStore.today;
  protected readonly savedNotice = this.challengeStore.savedNotice;

  protected readonly wallSquatDetail = computed(() => {
    const overview = this.wallSquat();
    const today = this.wallSquatToday();
    if (!overview || !today) {
      return '';
    }
    const target = `Target ${formatDuration(overview.challenge.targetSeconds)}`;
    if (today.bestSeconds === null) {
      return target;
    }
    const attempts = `${today.attemptCount} ${today.attemptCount === 1 ? 'attempt' : 'attempts'}`;
    return `${target} · best today ${formatDuration(today.bestSeconds)} · ${attempts}`;
  });

  protected readonly checkOffCards = computed<CheckOffCard[]>(() =>
    this.checkOffStore.active().flatMap((overview) => {
      const dayNumber = overview.todayDayNumber;
      if (dayNumber === null) {
        return [];
      }
      const todayCheckIn = overview.checkIns.find((checkIn) => checkIn.dayNumber === dayNumber);
      const detail = todayCheckIn ? todayCheckIn.note || 'Done today' : 'Not done yet today';
      return [{ overview, dayNumber, isDoneToday: todayCheckIn !== undefined, detail }];
    }),
  );

  /** "1 of 3 done today": every running challenge counts once. */
  protected readonly doneTodayLabel = computed(() => {
    const wallSquatCount = this.wallSquatToday() ? 1 : 0;
    const wallSquatDone = this.wallSquatToday()?.status === 'complete' ? 1 : 0;
    const cards = this.checkOffCards();
    const done = wallSquatDone + cards.filter((card) => card.isDoneToday).length;
    return `${done} of ${wallSquatCount + cards.length} done today`;
  });

  protected startHold(): void {
    // iOS only allows sound when it starts inside a tap, so unlock it here, before the timer.
    void this.sound.unlock();
    this.challengeStore.dismissSavedNotice();
    void this.router.navigate(['/timer']);
  }

  protected dismissNotice(): void {
    this.challengeStore.dismissSavedNotice();
  }
}
