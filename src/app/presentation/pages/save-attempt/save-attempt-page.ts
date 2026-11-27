import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DomainError, Feeling, isTooShortToKeep, MIN_ATTEMPT_SECONDS } from '../../../domain';
import { SOUND_PLAYER } from '../../../composition/provide-wall-squat';
import { DurationPipe } from '../../shared/duration.pipe';
import { AttemptDraftStore } from '../../state/attempt-draft-store';
import { ChallengeStore } from '../../state/challenge-store';

interface FeelingOption {
  readonly value: Feeling;
  readonly label: string;
}

/**
 * Screen 3: after Stop. The user saves or discards the hold (BR-05).
 * A hold under 5 seconds is never saved; the screen just says so.
 */
@Component({
  selector: 'app-save-attempt-page',
  imports: [DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './save-attempt-page.html',
  styleUrl: './save-attempt-page.scss',
})
export class SaveAttemptPage {
  private readonly store = inject(ChallengeStore);
  private readonly drafts = inject(AttemptDraftStore);
  private readonly sound = inject(SOUND_PLAYER);
  private readonly router = inject(Router);

  // The route guard makes sure a draft exists before this screen opens.
  protected readonly draft = this.drafts.draft()!;
  protected readonly isTooShort = isTooShortToKeep(this.draft.durationSeconds);
  protected readonly reachedTarget = this.draft.durationSeconds >= this.draft.targetSeconds;
  protected readonly minimumSeconds = MIN_ATTEMPT_SECONDS;

  protected readonly feelings: readonly FeelingOption[] = [
    { value: 'easy', label: 'Easy' },
    { value: 'solid', label: 'Solid' },
    { value: 'tough', label: 'Tough' },
  ];
  protected readonly feeling = signal<Feeling>('none');
  protected readonly note = signal('');
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');

  /** Tapping the chosen feeling again clears it. */
  protected toggleFeeling(value: Feeling): void {
    this.feeling.update((current) => (current === value ? 'none' : value));
  }

  protected async save(): Promise<void> {
    this.isSaving.set(true);
    this.errorMessage.set('');
    try {
      await this.store.record({
        durationSeconds: this.draft.durationSeconds,
        source: 'timer',
        dayNumber: this.draft.dayNumber,
        feeling: this.feeling(),
        note: this.note(),
      });
      await this.leaveTo('/today');
    } catch (error) {
      this.errorMessage.set(
        error instanceof DomainError ? error.message : 'Could not save. Try again.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  protected discard(): Promise<void> {
    return this.leaveTo('/today');
  }

  protected tryAgain(): Promise<void> {
    void this.sound.unlock(); // inside the tap, so the countdown beeps can play
    return this.leaveTo('/timer');
  }

  private async leaveTo(path: string): Promise<void> {
    this.drafts.clear();
    await this.router.navigate([path]);
  }
}
