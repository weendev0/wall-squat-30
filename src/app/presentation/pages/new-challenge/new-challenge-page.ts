import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  PendingTasks,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AddTimedCategoryUseCase, GetTimedCategoriesUseCase } from '../../../application';
import {
  ChallengeKind,
  CheckOffCategory,
  DEFAULT_TARGET_SECONDS,
  DomainError,
  isSameCategoryName,
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

/** A timed category chip, such as Wall Squat or Plank. */
interface CategoryOption {
  readonly name: string;
  /** BR-16: a category that is running cannot start a second challenge. */
  readonly isRunning: boolean;
}

/** A choice on the "What kind of challenge?" picker. */
interface KindOption {
  readonly kind: ChallengeKind;
  readonly title: string;
  readonly description: string;
}

/**
 * Screens 9 and 13: start a 30-day challenge today (BR-01, BR-13).
 * - Timed: pick a category and the daily target (BR-02, BR-15). One challenge per category
 *   runs at a time (BR-16); "+ Add category" saves a new one for next time.
 * - Daily check-off: pick a category and a name (BR-14).
 */
@Component({
  selector: 'app-new-challenge-page',
  imports: [DurationPipe, DurationFields, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-challenge-page.html',
  styleUrl: './new-challenge-page.scss',
})
export class NewChallengePage implements OnInit {
  private readonly challengeStore = inject(ChallengeStore);
  private readonly checkOffStore = inject(CheckOffStore);
  private readonly router = inject(Router);
  private readonly getTimedCategories = inject(GetTimedCategoriesUseCase);
  private readonly addTimedCategory = inject(AddTimedCategoryUseCase);
  private readonly pendingTasks = inject(PendingTasks);

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

  private readonly runningNames = this.challengeStore
    .active()
    .map((overview) => overview.challenge.name);
  private readonly categoryNames = signal<readonly string[]>([]);

  protected readonly kind = signal<ChallengeKind>('timed');
  protected readonly targetSeconds = signal(DEFAULT_TARGET_SECONDS);

  /** BR-15: Wall Squat first, then the categories the user added. */
  protected readonly timedCategories = computed<CategoryOption[]>(() =>
    this.categoryNames().map((name) => ({
      name,
      isRunning: this.runningNames.some((running) => isSameCategoryName(running, name)),
    })),
  );
  /** The chosen timed category, or null when every category is running. */
  protected readonly timedCategory = signal<string | null>(null);
  protected readonly isAddingCategory = signal(false);
  protected readonly newCategoryName = signal('');

  protected readonly category = signal<CheckOffCategory>('reading');
  protected readonly name = signal('');
  protected readonly isStarting = signal(false);
  protected readonly errorMessage = signal('');

  /** The Start button takes the colour of what is being started. */
  protected readonly startTone = computed(() =>
    toneClass(this.kind() === 'timed' ? 'exercise' : this.category()),
  );

  protected readonly canStart = computed(() =>
    this.kind() === 'timed' ? this.timedCategory() !== null : this.name().trim().length > 0,
  );

  async ngOnInit(): Promise<void> {
    // PendingTasks tells Angular the screen is still loading (tests wait for it).
    await this.pendingTasks.run(async () => {
      this.categoryNames.set(await this.getTimedCategories.execute());
      const firstFree = this.timedCategories().find((option) => !option.isRunning);
      this.timedCategory.set(firstFree?.name ?? null);
    });
  }

  protected pickTimedCategory(option: CategoryOption): void {
    if (!option.isRunning) {
      this.timedCategory.set(option.name);
      this.errorMessage.set('');
    }
  }

  /** BR-15: saves the typed category and selects it. */
  protected async addCategory(): Promise<void> {
    this.errorMessage.set('');
    try {
      const name = await this.addTimedCategory.execute(this.newCategoryName());
      this.categoryNames.set(await this.getTimedCategories.execute());
      this.isAddingCategory.set(false);
      this.newCategoryName.set('');
      const added = this.timedCategories().find((option) => option.name === name);
      if (added?.isRunning) {
        this.timedCategory.set(null);
        this.errorMessage.set(`${name} is already running. Pick another category.`);
      } else {
        this.timedCategory.set(name);
      }
    } catch (error) {
      this.errorMessage.set(
        error instanceof DomainError ? error.message : 'Could not add. Try again.',
      );
    }
  }

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
        // The Start button is disabled until a category is picked (canStart).
        await this.challengeStore.start(this.targetSeconds(), this.timedCategory()!);
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
