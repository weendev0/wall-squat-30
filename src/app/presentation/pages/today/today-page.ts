import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CheckOffOverview, TimedOverview } from '../../../application';
import { CheckIn, DayResult, formatDuration, isCountedGoal } from '../../../domain';
import { CLOCK, SOUND_PLAYER } from '../../../composition/provide-wall-squat';
import { ChallengeCard } from '../../shared/challenge-card';
import { CategoryLook, challengeLook } from '../../shared/challenge-category';
import { shortDateLabel } from '../../shared/date-label';
import { singular } from '../../shared/singular';
import { DurationPipe } from '../../shared/duration.pipe';
import { ChallengeStore, todayResult } from '../../state/challenge-store';
import { CheckOffStore } from '../../state/check-off-store';

/** A timed card, such as Wall Squat or Plank, ready to show. */
interface TimedCard {
  readonly overview: TimedOverview;
  readonly look: CategoryLook;
  readonly today: DayResult;
  readonly detail: string;
}

/** A check-off card, such as Reading or Water Drinking, ready to show. */
interface CheckOffCard {
  readonly overview: CheckOffOverview;
  readonly look: CategoryLook;
  readonly dayNumber: number;
  readonly isDoneToday: boolean;
  readonly detail: string;
  /** BR-23: set for a counted challenge such as 8 glasses of water; null for Just Done. */
  readonly counter: Counter | null;
}

/** BR-23: today's count on a counted card. */
interface Counter {
  readonly count: number;
  /** One entry per step of the goal; true when that step is counted. Drawn as dots. */
  readonly steps: readonly boolean[];
  /** For example "+1 glass". */
  readonly buttonLabel: string;
}

/**
 * Screens 1 and 12: every running challenge, each on its own card (BR-13, BR-16).
 * A timed card starts its timer; a check-off card opens Check-in.
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
  protected readonly savedNotice = computed(() => {
    const notice = this.challengeStore.savedNotice();
    if (notice === null) {
      return null;
    }
    const challengeName = this.challengeStore.find(notice.challengeId)?.challenge.name ?? '';
    return { ...notice, challengeName };
  });

  protected readonly timedCards = computed<TimedCard[]>(() =>
    this.challengeStore.active().flatMap((overview) => {
      const today = todayResult(overview);
      if (!today) {
        return [];
      }
      const look = challengeLook(overview.challenge);
      return [{ overview, look, today, detail: timedDetail(overview, today) }];
    }),
  );

  protected readonly checkOffCards = computed<CheckOffCard[]>(() =>
    this.checkOffStore.active().flatMap((overview) => {
      const dayNumber = overview.todayDayNumber;
      if (dayNumber === null) {
        return [];
      }
      const todayCheckIn = overview.checkIns.find((checkIn) => checkIn.dayNumber === dayNumber);
      const isDoneToday = overview.days[dayNumber - 1].status === 'complete';
      const isCounted = isCountedGoal(overview.challenge.dailyGoal);
      return [
        {
          overview,
          look: challengeLook(overview.challenge, overview.customCategory),
          dayNumber,
          isDoneToday,
          detail: checkOffDetail(overview, todayCheckIn, isDoneToday),
          counter: isCounted ? counterOf(overview, todayCheckIn) : null,
        },
      ];
    }),
  );

  /** "1 of 3 done today": every running challenge counts once. Empty when none is running. */
  protected readonly doneTodayLabel = computed(() => {
    const timed = this.timedCards();
    const checkOffs = this.checkOffCards();
    const done =
      timed.filter((card) => card.today.status === 'complete').length +
      checkOffs.filter((card) => card.isDoneToday).length;
    const total = timed.length + checkOffs.length;
    return total === 0 ? '' : `${done} of ${total} done today`;
  });

  protected startHold(challengeId: string): void {
    // iOS only allows sound when it starts inside a tap, so unlock it here, before the timer.
    void this.sound.unlock();
    this.challengeStore.dismissSavedNotice();
    void this.router.navigate(['/timer', challengeId]);
  }

  /** BR-23: "+1 glass" adds one to today's count; reaching the goal plays the chime (BR-16). */
  protected async countOneMore(card: CheckOffCard): Promise<void> {
    const count = (card.counter?.count ?? 0) + 1;
    const reachesGoal = !card.isDoneToday && count >= card.overview.challenge.dailyGoal;
    if (reachesGoal) {
      // iOS only plays sound that starts inside a tap, so unlock right here.
      void this.sound.unlock();
      this.sound.playChime();
    }
    await this.checkOffStore.checkIn({ challengeId: card.overview.challenge.id, count });
  }

  protected dismissNotice(): void {
    this.challengeStore.dismissSavedNotice();
  }
}

/** "Target 1:00 · best today 1:05 · 2 attempts" */
function timedDetail(overview: TimedOverview, today: DayResult): string {
  const target = `Target ${formatDuration(overview.challenge.targetSeconds)}`;
  if (today.bestSeconds === null) {
    return target;
  }
  const attempts = `${today.attemptCount} ${today.attemptCount === 1 ? 'attempt' : 'attempts'}`;
  return `${target} · best today ${formatDuration(today.bestSeconds)} · ${attempts}`;
}

/** Just Done: the note or whether it is done. Counted: "3 of 8 glasses", then the note. */
function checkOffDetail(
  overview: CheckOffOverview,
  todayCheckIn: CheckIn | undefined,
  isDoneToday: boolean,
): string {
  const { dailyGoal, unit } = overview.challenge;
  const note = todayCheckIn?.note ?? '';
  if (isCountedGoal(dailyGoal)) {
    const progress = `${todayCheckIn?.count ?? 0} of ${dailyGoal} ${unit}`;
    return note ? `${progress} · ${note}` : progress;
  }
  if (!isDoneToday) {
    return 'Not done yet today';
  }
  return note || 'Done today';
}

function counterOf(overview: CheckOffOverview, todayCheckIn: CheckIn | undefined): Counter {
  const { dailyGoal, unit } = overview.challenge;
  const count = todayCheckIn?.count ?? 0;
  const steps = Array.from({ length: dailyGoal }, (_, index) => index < count);
  return { count, steps, buttonLabel: `+1 ${singular(unit)}` };
}
