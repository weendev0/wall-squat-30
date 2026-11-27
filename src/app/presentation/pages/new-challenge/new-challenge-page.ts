import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ChallengeKind,
  CheckOffCategory,
  DEFAULT_TARGET_SECONDS,
  DomainError,
  MAX_CHALLENGE_NAME_LENGTH,
  MAX_TARGET_SECONDS,
  MIN_TARGET_SECONDS,
} from '../../../domain';
import { CLOCK } from '../../../composition/provide-wall-squat';
import { CATEGORY_LABELS, CHECK_OFF_CATEGORIES, toneClass } from '../../shared/challenge-category';
import { DurationFields } from '../../shared/duration-fields';
import { DurationPipe } from '../../shared/duration.pipe';
import { shortDateLabel } from '../../shared/date-label';
import { ChallengeStore } from '../../state/challenge-store';
import { CheckOffStore } from '../../state/check-off-store';

const STEP_SECONDS = 5;

/** A choice on the "What kind of challenge?" picker. */
interface KindOption {
  readonly kind: ChallengeKind;
  readonly title: string;
  readonly description: string;
}

/**
 * Screens 9 and 13: start a 30-day challenge today (BR-01, BR-13).
 * - Timed: pick the daily target (BR-02). Only one wall squat runs at a time.
 * - Daily check-off: pick a category and a name (BR-14).
 */
@Component({
  selector: 'app-new-challenge-page',
  imports: [DurationPipe, DurationFields, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-challenge-page.html',
  styleUrl: './new-challenge-page.scss',
})
export class NewChallengePage {
  private readonly challengeStore = inject(ChallengeStore);
  private readonly checkOffStore = inject(CheckOffStore);
  private readonly router = inject(Router);

  protected readonly startDateLabel = shortDateLabel(inject(CLOCK).today());
  protected readonly kindOptions: readonly KindOption[] = [
    { kind: 'timed', title: 'Timed', description: 'Hold for a target time, like the wall squat' },
    { kind: 'checkoff', title: 'Daily check-off', description: 'Tap Done once a day, with a note' },
  ];
  protected readonly categories = CHECK_OFF_CATEGORIES;
  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly toneClass = toneClass;
  protected readonly maxNameLength = MAX_CHALLENGE_NAME_LENGTH;
  protected readonly step = STEP_SECONDS;
  protected readonly presets = [45, 60, 90, 120];

  /** Only one wall squat runs at a time, so Timed is closed while one is running. */
  protected readonly isWallSquatRunning =
    this.challengeStore.overview()?.challenge.status === 'active';

  protected readonly kind = signal<ChallengeKind>(this.isWallSquatRunning ? 'checkoff' : 'timed');
  protected readonly targetSeconds = signal(DEFAULT_TARGET_SECONDS);
  protected readonly category = signal<CheckOffCategory>('reading');
  protected readonly name = signal('');
  protected readonly isStarting = signal(false);
  protected readonly errorMessage = signal('');

  /** The Start button takes the colour of what is being started. */
  protected readonly startTone = computed(() =>
    toneClass(this.kind() === 'timed' ? 'exercise' : this.category()),
  );

  protected readonly canStart = computed(() =>
    this.kind() === 'timed' ? !this.isWallSquatRunning : this.name().trim().length > 0,
  );

  protected pickKind(kind: ChallengeKind): void {
    this.kind.set(kind);
    this.errorMessage.set('');
  }

  protected changeBy(deltaSeconds: number): void {
    this.setTarget(this.targetSeconds() + deltaSeconds);
  }

  protected setTarget(seconds: number): void {
    const wholeSeconds = Number.isFinite(seconds) ? Math.round(seconds) : DEFAULT_TARGET_SECONDS;
    this.targetSeconds.set(
      Math.min(MAX_TARGET_SECONDS, Math.max(MIN_TARGET_SECONDS, wholeSeconds)),
    );
  }

  protected async start(): Promise<void> {
    this.isStarting.set(true);
    this.errorMessage.set('');
    try {
      if (this.kind() === 'timed') {
        await this.challengeStore.start(this.targetSeconds());
      } else {
        await this.checkOffStore.start({ name: this.name(), category: this.category() });
      }
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
