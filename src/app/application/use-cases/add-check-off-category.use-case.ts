import {
  assertCategoryNameIsFree,
  createCustomCheckOffCategory,
  CustomCheckOffCategory,
  CustomCheckOffCategoryFields,
} from '../../domain';
import { CheckOffCategoryRepository, IdGenerator } from '../ports';

/** BR-21: saves a new daily check-off category from the category sheet. */
export class AddCheckOffCategoryUseCase {
  constructor(
    private readonly categories: CheckOffCategoryRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(fields: CustomCheckOffCategoryFields): Promise<CustomCheckOffCategory> {
    const category = createCustomCheckOffCategory(this.ids.newId(), fields);
    assertCategoryNameIsFree(category.name, await this.categories.findAll());
    await this.categories.save(category);
    return category;
  }
}
