import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Attempt, DayStatus, formatDuration } from '../../../domain';
import { DurationPipe } from '../../shared/duration.pipe';
import { shortDateLabel } from '../../shared/date-label';
import { feelingLabel } from '../../shared/feelings';
import { ChallengeStore } from '../../state/challenge-store';

/** One bar of the "Hold time per day" chart. */
interface DayBar {
  readonly dayNumber: number;
  readonly status: DayStatus;
  /** Height as a share of the chart, from 0 to 1. */
  readonly height: number;
  readonly accessibleLabel: string;
}

/** One row of the recent attempts list. */
interface RecentRow {
  readonly id: string;
  readonly title: string;
  readonly details: string;
  readonly durationSeconds: number;
  readonly isMakeUp: boolean;
  readonly isManual: boolean;
}

const RECENT_ROW_COUNT = 5;
/** The chart is a bit taller than the target, so a hold over target still fits below the top. */
const CHART_HEADROOM = 4 / 3;
/** Missed days still get a small bar, so the gap is visible. */
const MIN_BAR_HEIGHT = 0.03;

/** Screen 5: totals, the best hold of each day as a chart, and the latest attempts. */
@Component({
  selector: 'app-history-page',
  imports: [DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './history-page.html',
  styleUrl: './history-page.scss',
})
export class HistoryPage {
  private readonly store = inject(ChallengeStore);

  protected readonly overview = this.store.overview;

  /** The top of the chart, in seconds. */
  private readonly chartMaxSeconds = computed(() => {
    const overview = this.overview();
    if (!overview) {
      return 1;
    }
    const best = overview.progress.bestHoldSeconds ?? 0;
    return Math.max(overview.challenge.targetSeconds * CHART_HEADROOM, best);
  });

  /** Where the dashed target line sits, as a share of the chart height. */
  protected readonly targetLine = computed(
    () => (this.overview()?.challenge.targetSeconds ?? 0) / this.chartMaxSeconds(),
  );

  /** One bar for every day up to today (or all 30 once the challenge has ended). */
  protected readonly bars = computed<DayBar[]>(() => {
    const overview = this.overview();
    if (!overview) {
      return [];
    }
    const shownDays = overview.days.filter((day) => day.status !== 'upcoming');
    return shownDays.map((day) => ({
      dayNumber: day.dayNumber,
      status: day.status,
      height: Math.max(MIN_BAR_HEIGHT, (day.bestSeconds ?? 0) / this.chartMaxSeconds()),
      accessibleLabel: `Day ${day.dayNumber}: ${day.bestSeconds === null ? 'no attempt' : formatDuration(day.bestSeconds)}`,
    }));
  });

  /** The latest attempts, newest first. */
  protected readonly recent = computed<RecentRow[]>(() => {
    const overview = this.overview();
    if (!overview) {
      return [];
    }
    const best = overview.progress.bestHoldSeconds;
    let bestIsMarked = false;

    return [...overview.attempts]
      .sort(newestFirst)
      .slice(0, RECENT_ROW_COUNT)
      .map((attempt) => {
        const isBest = !bestIsMarked && attempt.durationSeconds === best;
        bestIsMarked ||= isBest;
        const details = [feelingLabel(attempt.feeling), isBest ? 'best hold' : '']
          .filter((part) => part !== '')
          .join(' · ');
        return {
          id: attempt.id,
          title: `Day ${attempt.dayNumber} · ${shortDateLabel(overview.days[attempt.dayNumber - 1].date)}`,
          details,
          durationSeconds: attempt.durationSeconds,
          isMakeUp: attempt.isMakeUp,
          isManual: attempt.source === 'manual',
        };
      });
  });
}

/** Attempts have no time of day, so the latest day comes first, then the latest saved date. */
function newestFirst(a: Attempt, b: Attempt): number {
  return b.dayNumber - a.dayNumber || b.recordedOn.localeCompare(a.recordedOn);
}
