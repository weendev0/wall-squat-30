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
import {
  AddTimedCategoryUseCase,
  CheckOffCategoryOption,
  GetCheckOffCategoriesUseCase,
  GetTimedCategoriesUseCase,
  StartCheckOffChallengeInput,
} from '../../../application';
import {
  BuiltInCheckOffCategory,
  ChallengeKind,
  CustomCheckOffCategory,
  DEFAULT_TARGET_SECONDS,
  DomainError,
  isCountedGoal,
  isSameCategoryName,
  MAX_CHALLENGE_NAME_LENGTH,
  MAX_TARGET_SECONDS,
  MIN_TARGET_SECONDS,
} from '../../../domain';
import { CLOCK } from '../../../composition/provide-wall-squat';
import {
  builtInLook,
  CategoryLook,
  CHECK_OFF_CATEGORIES,
  customLook,
} from '../../shared/challenge-category';
import { DurationFields } from '../../shared/duration-fields';
import { DurationPipe } from '../../shared/duration.pipe';
import { shortDateLabel } from '../../shared/date-label';
import { ChallengeStore } from '../../state/challenge-store';
import { CheckOffStore } from '../../state/check-off-store';
import { CategorySheet } from './category-sheet';

const STEP_SECONDS = 5;

/** A timed category chip, such as Wall Squat or Plank. */
interface CategoryOption {
  readonly name: string;
  /** BR-16: a category that is running cannot start a second challenge. */
  readonly isRunning: boolean;
}

/** The picked check-off category: a built-in one, or one of the user's own (BR-21). */
type CheckOffChoice =
  | { readonly kind: 'built-in'; readonly category: BuiltInCheckOffCategory }
  | { readonly kind: 'custom'; readonly categoryId: string };

/** A check-off category chip: built-in or the user's own. */
interface CheckOffChip {
  readonly choice: CheckOffChoice;
  readonly look: CategoryLook;
}

/** What the category sheet is open for: adding, or editing one category. */
type SheetState =
  { readonly mode: 'add' } | { readonly mode: 'edit'; readonly option: CheckOffCategoryOption };

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
 * - Daily check-off: pick a category and a name (BR-14). "+ Add category" opens a sheet to add
 *   one of your own, such as Water Drinking; a selected one of your own can be edited (BR-21, BR-24).
 */
@Component({
  selector: 'app-new-challenge-page',
  imports: [CategorySheet, DurationPipe, DurationFields, RouterLink],
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
  private readonly getCheckOffCategories = inject(GetCheckOffCategoriesUseCase);
  private readonly pendingTasks = inject(PendingTasks);

  protected readonly startDateLabel = shortDateLabel(inject(CLOCK).today());
  protected readonly kindOptions: readonly KindOption[] = [
    { kind: 'timed', title: 'Timed', description: 'Hold for a target time, like the wall squat' },
    { kind: 'checkoff', title: 'Daily check-off', description: 'Tap Done once a day, with a note' },
  ];
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

  /** BR-21: the user's own check-off categories, after the built-in ones. */
  private readonly customCategories = signal<readonly CheckOffCategoryOption[]>([]);
  protected readonly checkOffChips = computed<CheckOffChip[]>(() => [
    ...CHECK_OFF_CATEGORIES.map((category) => ({
      choice: { kind: 'built-in', category } as const,
      look: builtInLook(category),
    })),
    ...this.customCategories().map(({ category }) => ({
      choice: { kind: 'custom', categoryId: category.id } as const,
      look: customLook(category),
    })),
  ]);
  protected readonly checkOffChoice = signal<CheckOffChoice>({
    kind: 'built-in',
    category: 'reading',
  });
  /** The picked category of the user's own, or null when a built-in one is picked. */
  protected readonly pickedCustom = computed<CheckOffCategoryOption | null>(() => {
    const choice = this.checkOffChoice();
    return choice.kind === 'custom'
      ? (this.customCategories().find(({ category }) => category.id === choice.categoryId) ?? null)
      : null;
  });
  protected readonly sheet = signal<SheetState | null>(null);
  protected readonly name = signal('');
  protected readonly isStarting = signal(false);
  protected readonly errorMessage = signal('');

  /** The Start button takes the colour of what is being started. */
  protected readonly startTone = computed(() => {
    if (this.kind() === 'timed') {
      return builtInLook('exercise').toneClass;
    }
    const custom = this.pickedCustom();
    return custom
      ? customLook(custom.category).toneClass
      : builtInLook(this.pickedBuiltIn()).toneClass;
  });

  /** BR-22: how a day of the picked category counts, shown under the name. */
  protected readonly checkOffHint = computed(() => {
    const custom = this.pickedCustom()?.category;
    if (custom && isCountedGoal(custom.dailyGoal)) {
      return (
        `Goal: ${custom.dailyGoal} ${custom.unit} a day. The day is done when you reach ` +
        `${custom.dailyGoal}, and you can add a note.`
      );
    }
    return 'Each day you tap Done and can add a note. No timer.';
  });

  protected readonly canStart = computed(() =>
    this.kind() === 'timed' ? this.timedCategory() !== null : this.name().trim().length > 0,
  );

  async ngOnInit(): Promise<void> {
    // PendingTasks tells Angular the screen is still loading (tests wait for it).
    await this.pendingTasks.run(async () => {
      this.categoryNames.set(await this.getTimedCategories.execute());
      const firstFree = this.timedCategories().find((option) => !option.isRunning);
      this.timedCategory.set(firstFree?.name ?? null);
      await this.reloadCheckOffCategories();
    });
  }

  protected isPicked(choice: CheckOffChoice): boolean {
    const picked = this.checkOffChoice();
    return choice.kind === 'built-in'
      ? picked.kind === 'built-in' && picked.category === choice.category
      : picked.kind === 'custom' && picked.categoryId === choice.categoryId;
  }

  /** Picking one of your own categories fills in its name when the name is still empty. */
  protected pickCheckOff(choice: CheckOffChoice): void {
    this.checkOffChoice.set(choice);
    this.errorMessage.set('');
    const custom = this.pickedCustom();
    if (custom && this.name().trim() === '') {
      this.name.set(custom.category.name);
    }
  }

  protected openAddSheet(): void {
    this.sheet.set({ mode: 'add' });
  }

  protected openEditSheet(option: CheckOffCategoryOption): void {
    this.sheet.set({ mode: 'edit', option });
  }

  protected closeSheet(): void {
    this.sheet.set(null);
  }

  /** BR-21: a new or edited category is picked straight away. */
  protected async onCategorySaved(category: CustomCheckOffCategory): Promise<void> {
    const wasEditing = this.sheet()?.mode === 'edit';
    this.sheet.set(null);
    await this.reloadCheckOffCategories();
    if (!wasEditing) {
      this.name.set('');
    }
    this.pickCheckOff({ kind: 'custom', categoryId: category.id });
  }

  /** BR-24: after a delete, Reading is picked again. */
  protected async onCategoryDeleted(): Promise<void> {
    this.sheet.set(null);
    await this.reloadCheckOffCategories();
    this.checkOffChoice.set({ kind: 'built-in', category: 'reading' });
  }

  private async reloadCheckOffCategories(): Promise<void> {
    this.customCategories.set(await this.getCheckOffCategories.execute());
  }

  private pickedBuiltIn(): BuiltInCheckOffCategory {
    const choice = this.checkOffChoice();
    return choice.kind === 'built-in' ? choice.category : 'reading';
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
        await this.checkOffStore.start(this.checkOffStartInput());
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

  private checkOffStartInput(): StartCheckOffChallengeInput {
    const choice = this.checkOffChoice();
    return choice.kind === 'custom'
      ? { name: this.name(), customCategoryId: choice.categoryId }
      : { name: this.name(), category: choice.category };
  }
}
