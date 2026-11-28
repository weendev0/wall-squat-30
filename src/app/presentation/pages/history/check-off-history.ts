import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CheckOffOverview } from '../../../application';
import { CHALLENGE_LENGTH_DAYS, dateOfDay } from '../../../domain';
import { shortDateLabel } from '../../shared/date-label';

/** One day in the notes list. */
interface NoteRow {
  readonly id: string;
  readonly title: string;
  readonly note: string;
  readonly isMakeUp: boolean;
}

/**
 * History of a Reading, Course or Study challenge: its totals and every day's note,
 * newest first (BR-15). Shares its look with the timed History screen.
 */
@Component({
  selector: 'app-check-off-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './check-off-history.html',
  styleUrl: './history-page.scss',
})
export class CheckOffHistory {
  readonly overview = input.required<CheckOffOverview>();

  protected readonly challengeLength = CHALLENGE_LENGTH_DAYS;

  protected readonly noteCount = computed(
    () => this.overview().checkIns.filter((checkIn) => checkIn.note !== '').length,
  );

  /** Every Done, newest day first (the overview already sorts them). */
  protected readonly rows = computed<NoteRow[]>(() => {
    const { challenge, checkIns } = this.overview();
    return checkIns.map((checkIn) => ({
      id: checkIn.id,
      title: `Day ${checkIn.dayNumber} · ${shortDateLabel(dateOfDay(challenge, checkIn.dayNumber))}`,
      note: checkIn.note,
      isMakeUp: checkIn.isMakeUp,
    }));
  });
}
