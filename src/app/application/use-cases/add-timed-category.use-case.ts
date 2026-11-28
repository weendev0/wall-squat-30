import { createTimedCategory, isSameCategoryName, timedCategoryNames } from '../../domain';
import { IdGenerator, TimedCategoryRepository } from '../ports';

/**
 * BR-15: saves a category the user typed, so it is offered next time.
 * A name that already exists (ignoring case) is not saved twice; its existing
 * spelling is returned instead, so the screen can select it.
 */
export class AddTimedCategoryUseCase {
  constructor(
    private readonly categories: TimedCategoryRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(name: string): Promise<string> {
    const category = createTimedCategory(this.ids.newId(), name);
    const existing = timedCategoryNames(await this.categories.findAll()).find((known) =>
      isSameCategoryName(known, category.name),
    );
    if (existing !== undefined) {
      return existing;
    }
    await this.categories.save(category);
    return category.name;
  }
}
