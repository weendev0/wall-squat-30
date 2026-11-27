import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CheckOffOverview } from '../../../application';
import { CHALLENGE_LENGTH_DAYS, DayResult, DayStatus } from '../../../domain';
import { shortDateLabel } from '../../shared/date-label';

/** One square of a check-off 30-day grid, ready to show. */
interface CheckOffCell {
  readonly dayNumber: number;
  readonly status: DayStatus;
  readonly caption: string;
  readonly isToday: boolean;
  readonly isMadeUp: boolean;
  readonly hasNote: boolean;
  readonly accessibleLabel: string;
}

/**
 * Screen 15: the 30-day grid of a Reading, Course or Study challenge (BR-14 to BR-18).
 * Shares its look with the timed Progress screen (same stylesheet).
 */
@Component({
  selector: 'app-check-off-progress',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './check-off-progress.html',
  styleUrl: './progress-page.scss',
})
export class CheckOffProgress {
  readonly overview = input.required<CheckOffOverview>();

  protected readonly challengeLength = CHALLENGE_LENGTH_DAYS;
  protected readonly startedLabel = computed(() =>
    shortDateLabel(this.overview().challenge.startDate),
  );
  protected readonly daysToGo = computed(
    () => CHALLENGE_LENGTH_DAYS - this.overview().progress.daysComplete,
  );
  protected readonly completedShare = computed(
    () => this.overview().progress.daysComplete / CHALLENGE_LENGTH_DAYS,
  );
  protected readonly missedDayCount = computed(() => this.overview().progress.daysToMakeUp.length);

  protected readonly cells = computed<CheckOffCell[]>(() =>
    this.overview().days.map((day) => toCell(day, this.overview().todayDayNumber)),
  );

  /** BR-17: the earliest missed day, while the challenge is still running. */
  protected readonly makeUpDay = computed<number | null>(() => {
    const overview = this.overview();
    const dayNumber = overview.progress.daysToMakeUp[0];
    return dayNumber !== undefined && overview.todayDayNumber !== null ? dayNumber : null;
  });
}

function toCell(day: DayResult, todayDayNumber: number | null): CheckOffCell {
  const caption = day.status === 'complete' ? '✓' : day.status === 'missed' ? 'missed' : '';
  const extras = [day.completedByMakeUp ? 'made up' : '', day.hasNote ? 'has a note' : '']
    .filter((part) => part !== '')
    .map((part) => `, ${part}`)
    .join('');
  return {
    dayNumber: day.dayNumber,
    status: day.status,
    caption,
    isToday: day.dayNumber === todayDayNumber,
    isMadeUp: day.completedByMakeUp,
    hasNote: day.hasNote,
    accessibleLabel: `Day ${day.dayNumber}, ${day.status === 'complete' ? 'done' : day.status}${extras}`,
  };
}
