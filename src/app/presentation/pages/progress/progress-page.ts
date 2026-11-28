import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CHALLENGE_LENGTH_DAYS, DayResult, DayStatus, formatDuration } from '../../../domain';
import { DurationPipe } from '../../shared/duration.pipe';
import { shortDateLabel } from '../../shared/date-label';
import { ChallengeTabs, selectedChallenge } from '../../shared/challenge-tabs';
import { ChallengeStore, todayResult } from '../../state/challenge-store';
import { CheckOffStore } from '../../state/check-off-store';
import { CheckOffProgress } from './check-off-progress';

/** One square of the 30-day grid, ready to show. */
interface DayCell {
  readonly dayNumber: number;
  readonly status: DayStatus;
  /** '1:05', 'missed' or '' for days still to come. */
  readonly caption: string;
  readonly isToday: boolean;
  /** BR-07: the target was only reached by a later make-up. */
  readonly isMadeUp: boolean;
  /** BR-08: at least one attempt was typed in by hand. */
  readonly hasManualAttempt: boolean;
  /** Read out by VoiceOver, e.g. "Day 4, missed". */
  readonly accessibleLabel: string;
}

/** A past day that can still be made up (BR-07), shown under the grid. */
interface MakeUpSuggestion {
  readonly dayNumber: number;
  readonly reason: string;
}

/**
 * Screens 4 and 15: the 30-day grid with today's result, the totals and the next make-up.
 * Tabs at the top switch between challenges; a check-off challenge shows CheckOffProgress.
 */
@Component({
  selector: 'app-progress-page',
  imports: [ChallengeTabs, CheckOffProgress, DurationPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress-page.html',
  styleUrl: './progress-page.scss',
})
export class ProgressPage {
  private readonly store = inject(ChallengeStore);

  /** From ?challenge=<id>, set by the tabs. */
  readonly challenge = input<string>();

  protected readonly checkOffs = inject(CheckOffStore).active;
  protected readonly selected = selectedChallenge(
    this.challenge,
    this.store.active,
    this.checkOffs,
  );

  protected readonly challengeLength = CHALLENGE_LENGTH_DAYS;
  /** The selected timed challenge; check-off challenges show CheckOffProgress instead. */
  protected readonly overview = this.selected.timed;
  protected readonly today = computed(() => {
    const overview = this.overview();
    return overview ? todayResult(overview) : null;
  });

  protected readonly startedLabel = computed(() => {
    const startDate = this.overview()?.challenge.startDate;
    return startDate ? shortDateLabel(startDate) : '';
  });

  protected readonly daysToGo = computed(
    () => CHALLENGE_LENGTH_DAYS - (this.overview()?.progress.daysComplete ?? 0),
  );

  protected readonly completedShare = computed(
    () => (this.overview()?.progress.daysComplete ?? 0) / CHALLENGE_LENGTH_DAYS,
  );

  protected readonly shortDayCount = computed(() => this.countPastDays('under-target'));
  protected readonly missedDayCount = computed(() => this.countPastDays('missed'));

  protected readonly cells = computed<DayCell[]>(() => {
    const overview = this.overview();
    if (!overview) {
      return [];
    }
    return overview.days.map((day) => toCell(day, overview.todayDayNumber));
  });

  /** The earliest past day that is not done yet, so the user can fill it in. */
  protected readonly makeUp = computed<MakeUpSuggestion | null>(() => {
    const overview = this.overview();
    const dayNumber = overview?.progress.daysToMakeUp[0];
    if (!overview || dayNumber === undefined || overview.todayDayNumber === null) {
      return null; // nothing to make up, or the challenge has ended
    }
    const day = overview.days[dayNumber - 1];
    const reason =
      day.status === 'missed'
        ? `Day ${dayNumber} was missed`
        : `Day ${dayNumber} was under target (${formatDuration(day.bestSeconds ?? 0)})`;
    return { dayNumber, reason };
  });

  private countPastDays(status: DayStatus): number {
    const overview = this.overview();
    if (!overview) {
      return 0;
    }
    return overview.progress.daysToMakeUp.filter(
      (dayNumber) => overview.days[dayNumber - 1].status === status,
    ).length;
  }
}

function toCell(day: DayResult, todayDayNumber: number | null): DayCell {
  const caption =
    day.bestSeconds !== null
      ? formatDuration(day.bestSeconds)
      : day.status === 'missed'
        ? 'missed'
        : '';
  return {
    dayNumber: day.dayNumber,
    status: day.status,
    caption,
    isToday: day.dayNumber === todayDayNumber,
    isMadeUp: day.completedByMakeUp,
    hasManualAttempt: day.hasManualAttempt,
    accessibleLabel: `Day ${day.dayNumber}, ${caption || day.status}${day.completedByMakeUp ? ', made up' : ''}`,
  };
}
