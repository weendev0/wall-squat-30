import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import {
  AddCheckOffCategoryUseCase,
  DeleteCheckOffCategoryUseCase,
  EditCheckOffCategoryUseCase,
} from '../../../application';
import {
  CATEGORY_ICONS,
  CATEGORY_TONES,
  CategoryTone,
  CustomCheckOffCategory,
  CustomCheckOffCategoryFields,
  DomainError,
  isCountedGoal,
  JUST_DONE_GOAL,
  MAX_CHALLENGE_NAME_LENGTH,
  MAX_DAILY_GOAL,
  MAX_UNIT_LENGTH,
} from '../../../domain';

/** A new category starts as 8 glasses of water: the first one Ween asked for. */
const NEW_CATEGORY: CustomCheckOffCategoryFields = {
  name: '',
  tone: 'sky',
  icon: '💧',
  dailyGoal: 8,
  unit: 'glasses',
};

/** The smallest goal that still counts (a goal of 1 is Just Done). */
const MIN_COUNTED_GOAL = JUST_DONE_GOAL + 1;

/**
 * BR-21, BR-22, BR-24: the bottom sheet on New challenge that adds or edits a daily
 * check-off category of the user's own: name, colour, icon and how a day counts.
 * Pass `category` to edit it; leave it null to add a new one.
 */
@Component({
  selector: 'app-category-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-sheet.html',
  styleUrl: './category-sheet.scss',
})
export class CategorySheet {
  private readonly addUseCase = inject(AddCheckOffCategoryUseCase);
  private readonly editUseCase = inject(EditCheckOffCategoryUseCase);
  private readonly deleteUseCase = inject(DeleteCheckOffCategoryUseCase);

  /** The category to edit, or null to add a new one. */
  readonly category = input<CustomCheckOffCategory | null>(null);
  /** BR-24: false when a challenge uses the category, so it cannot be deleted. */
  readonly canDelete = input(false);

  /** The category was added or edited. */
  readonly saved = output<CustomCheckOffCategory>();
  /** The category was deleted. */
  readonly deleted = output<void>();
  readonly closed = output<void>();

  protected readonly tones = CATEGORY_TONES;
  protected readonly icons = CATEGORY_ICONS;
  protected readonly maxNameLength = MAX_CHALLENGE_NAME_LENGTH;
  protected readonly maxUnitLength = MAX_UNIT_LENGTH;
  protected readonly maxGoal = MAX_DAILY_GOAL;
  protected readonly minGoal = MIN_COUNTED_GOAL;

  /** The fields on the sheet. Starts from the category being edited, or from NEW_CATEGORY. */
  protected readonly fields = linkedSignal<CustomCheckOffCategoryFields>(
    () => this.category() ?? NEW_CATEGORY,
  );
  /** BR-22: the goal to go back to when switching from Just Done to Count. */
  private readonly lastCountedGoal = linkedSignal(() => {
    const goal = this.category()?.dailyGoal ?? NEW_CATEGORY.dailyGoal;
    return isCountedGoal(goal) ? goal : NEW_CATEGORY.dailyGoal;
  });

  protected readonly isEditing = computed(() => this.category() !== null);
  protected readonly isCounted = computed(() => isCountedGoal(this.fields().dailyGoal));
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');

  protected setName(name: string): void {
    this.update({ name });
  }

  protected setTone(tone: CategoryTone): void {
    this.update({ tone });
  }

  protected setIcon(icon: string): void {
    this.update({ icon });
  }

  protected setUnit(unit: string): void {
    this.update({ unit });
  }

  /** BR-22: Just Done is a goal of 1; Count goes back to the last counted goal. */
  protected setCounted(counted: boolean): void {
    this.update({ dailyGoal: counted ? this.lastCountedGoal() : JUST_DONE_GOAL });
  }

  protected changeGoal(delta: number): void {
    const goal = this.fields().dailyGoal + delta;
    const dailyGoal = Math.min(MAX_DAILY_GOAL, Math.max(MIN_COUNTED_GOAL, goal));
    this.lastCountedGoal.set(dailyGoal);
    this.update({ dailyGoal });
  }

  protected async save(): Promise<void> {
    await this.run(async () => {
      const editing = this.category();
      const saved = editing
        ? await this.editUseCase.execute(editing.id, this.fields())
        : await this.addUseCase.execute(this.fields());
      this.saved.emit(saved);
    });
  }

  protected async delete(): Promise<void> {
    const editing = this.category();
    if (editing === null) {
      return;
    }
    await this.run(async () => {
      await this.deleteUseCase.execute(editing.id);
      this.deleted.emit();
    });
  }

  private update(changes: Partial<CustomCheckOffCategoryFields>): void {
    this.fields.update((fields) => ({ ...fields, ...changes }));
    this.errorMessage.set('');
  }

  /** Runs a save or delete, showing a rule the user broke (DomainError) as a message. */
  private async run(action: () => Promise<void>): Promise<void> {
    this.isSaving.set(true);
    this.errorMessage.set('');
    try {
      await action();
    } catch (error) {
      this.errorMessage.set(
        error instanceof DomainError ? error.message : 'Could not save. Try again.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }
}
