import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  DEFAULT_TARGET_SECONDS,
  DomainError,
  MAX_TARGET_SECONDS,
  MIN_TARGET_SECONDS,
} from '../../../domain';
import { CLOCK } from '../../../composition/provide-wall-squat';
import { DurationPipe } from '../../shared/duration.pipe';
import { shortDateLabel } from '../../shared/date-label';
import { ChallengeStore } from '../../state/challenge-store';

const STEP_SECONDS = 5;
const SECONDS_PER_MINUTE = 60;

/** Screen 9: pick the daily target and start a 30-day challenge today (BR-01, BR-02). */
@Component({
  selector: 'app-new-challenge-page',
  imports: [DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-challenge-page.html',
  styleUrl: './new-challenge-page.scss',
})
export class NewChallengePage {
  private readonly store = inject(ChallengeStore);
  private readonly router = inject(Router);

  protected readonly startDateLabel = shortDateLabel(inject(CLOCK).today());
  protected readonly step = STEP_SECONDS;
  protected readonly presets = [45, 60, 90, 120];
  protected readonly targetSeconds = signal(DEFAULT_TARGET_SECONDS);
  protected readonly minutes = computed(() =>
    Math.floor(this.targetSeconds() / SECONDS_PER_MINUTE),
  );
  protected readonly seconds = computed(() => this.targetSeconds() % SECONDS_PER_MINUTE);
  protected readonly isStarting = signal(false);
  protected readonly errorMessage = signal('');

  protected changeBy(deltaSeconds: number): void {
    this.setTarget(this.targetSeconds() + deltaSeconds);
  }

  protected setTarget(seconds: number): void {
    const wholeSeconds = Number.isFinite(seconds) ? Math.round(seconds) : DEFAULT_TARGET_SECONDS;
    this.targetSeconds.set(
      Math.min(MAX_TARGET_SECONDS, Math.max(MIN_TARGET_SECONDS, wholeSeconds)),
    );
  }

  /** Called when the user leaves the minutes or seconds box. */
  protected setFromFields(minutesText: string, secondsText: string): void {
    const minutes = Number(minutesText) || 0;
    const seconds = Number(secondsText) || 0;
    this.setTarget(minutes * SECONDS_PER_MINUTE + seconds);
  }

  protected async start(): Promise<void> {
    this.isStarting.set(true);
    this.errorMessage.set('');
    try {
      await this.store.start(this.targetSeconds());
      await this.router.navigate(['/today']);
    } catch (error) {
      this.errorMessage.set(
        error instanceof DomainError ? error.message : 'Could not start. Try again.',
      );
    } finally {
      this.isStarting.set(false);
    }
  }
}
