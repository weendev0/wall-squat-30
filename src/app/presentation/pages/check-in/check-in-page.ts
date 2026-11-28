import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  CHALLENGE_LENGTH_DAYS,
  CheckOffCategory,
  dateOfDay,
  DomainError,
  isCountedGoal,
  MAX_DAY_COUNT,
  MAX_NOTE_LENGTH,
} from '../../../domain';
import { SOUND_PLAYER } from '../../../composition/provide-wall-squat';
import { challengeLook } from '../../shared/challenge-category';
import { shortDateLabel } from '../../shared/date-label';
import { CheckOffStore } from '../../state/check-off-store';

/** "Tap when you have read", "... studied", or "... done it" for your own categories. */
const DONE_VERBS: Record<CheckOffCategory, string> = {
  reading: 'read',
  course: 'studied',
  study: 'studied',
  custom: 'done it',
};

/**
 * Screen 14: mark a check-off day as done, with an optional note.
 * - BR-14: one Done per day; tapping the big button again undoes it.
 * - BR-23: a counted challenge, such as 8 glasses of water, shows − and + instead;
 *   reaching the goal plays the chime, and saving a count of 0 removes the day.
 * - BR-15: the note is saved with the Done and can be changed later.
 * - BR-16: marking Done plays a short chime.
 * - BR-17: opened with ?day=n for an earlier day, it makes that day up.
 */
@Component({
  selector: 'app-check-in-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './check-in-page.html',
  styleUrl: './check-in-page.scss',
})
export class CheckInPage {
  private readonly store = inject(CheckOffStore);
  private readonly sound = inject(SOUND_PLAYER);
  private readonly router = inject(Router);

  /** From the address /check-in/:challengeId. */
  readonly challengeId = input.required<string>();
  /** From ?day=n, only when making up an earlier day. */
  readonly day = input<string>();

  protected readonly challengeLength = CHALLENGE_LENGTH_DAYS;
  protected readonly maxNoteLength = MAX_NOTE_LENGTH;
  protected readonly maxCount = MAX_DAY_COUNT;

  // The route guard makes sure this challenge is running.
  protected readonly overview = computed(() => this.store.find(this.challengeId())!);
  protected readonly look = computed(() =>
    challengeLook(this.overview().challenge, this.overview().customCategory),
  );
  protected readonly isCounted = computed(() => isCountedGoal(this.overview().challenge.dailyGoal));
  protected readonly isMakeUp = computed(() => this.day() !== undefined);

  protected readonly dayNumber = computed(() =>
    Number(this.day() ?? this.overview().todayDayNumber),
  );

  protected readonly dateLabel = computed(() =>
    shortDateLabel(dateOfDay(this.overview().challenge, this.dayNumber())),
  );

  /** The Done already saved for this day, if any. */
  private readonly existing = computed(
    () =>
      this.overview().checkIns.find((checkIn) => checkIn.dayNumber === this.dayNumber()) ?? null,
  );

  /** What the big button shows. Starts from what is saved, then follows the user's taps. */
  protected readonly done = linkedSignal(() => this.existing() !== null);
  /** BR-23: the count of a counted challenge. Starts from what is saved. */
  protected readonly count = linkedSignal(() => this.existing()?.count ?? 0);
  protected readonly note = linkedSignal(() => this.existing()?.note ?? '');
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly hint = computed(() => {
    const { dailyGoal, unit } = this.overview().challenge;
    if (this.isCounted()) {
      return this.count() >= dailyGoal
        ? `Goal reached: ${this.count()} of ${dailyGoal} ${unit}.`
        : `${this.count()} of ${dailyGoal} ${unit}. The day is done at ${dailyGoal}.`;
    }
    const verb = DONE_VERBS[this.overview().challenge.category];
    return this.done()
      ? 'Done! A short chime played. Tap again to undo.'
      : `Tap when you have ${verb}. A short chime confirms it.`;
  });

  protected toggleDone(): void {
    const markingDone = !this.done();
    this.done.set(markingDone);
    if (markingDone) {
      // iOS only plays sound that starts inside a tap, so unlock right here.
      void this.sound.unlock();
      this.sound.playChime();
    }
  }

  /** BR-23: − and + change the count; reaching the goal plays the chime (BR-16). */
  protected changeCount(delta: number): void {
    const goal = this.overview().challenge.dailyGoal;
    const next = Math.min(MAX_DAY_COUNT, Math.max(0, this.count() + delta));
    if (this.count() < goal && next >= goal) {
      void this.sound.unlock();
      this.sound.playChime();
    }
    this.count.set(next);
  }

  /** What Save keeps: for Just Done the big button, for a counted challenge the count. */
  private readonly countToSave = computed(() => {
    if (this.isCounted()) {
      return this.count();
    }
    return this.done() ? 1 : 0;
  });

  protected async save(): Promise<void> {
    this.isSaving.set(true);
    this.errorMessage.set('');
    const challengeId = this.challengeId();
    try {
      const count = this.countToSave();
      if (count > 0) {
        await this.store.checkIn({
          challengeId,
          dayNumber: this.dayNumber(),
          note: this.note(),
          count,
        });
      } else if (this.existing() !== null) {
        await this.store.undoCheckIn(challengeId, this.dayNumber());
      }
      await this.goBack();
    } catch (error) {
      this.errorMessage.set(
        error instanceof DomainError ? error.message : 'Could not save. Try again.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  /** A make-up came from Progress, so it goes back there; today's Done goes back to Today. */
  private async goBack(): Promise<void> {
    if (this.isMakeUp()) {
      await this.router.navigate(['/progress'], { queryParams: { challenge: this.challengeId() } });
    } else {
      await this.router.navigate(['/today']);
    }
  }
}
