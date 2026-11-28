import {
  assertCategoryNameIsFree,
  CustomCheckOffCategory,
  CustomCheckOffCategoryFields,
  DomainError,
  editCustomCheckOffCategory,
} from '../../domain';
import { CheckOffCategoryRepository } from '../ports';

/**
 * BR-24: changes the name, colour, icon or goal of a category of the user's own.
 * Running challenges keep the goal they started with (BR-22).
 */
export class EditCheckOffCategoryUseCase {
  constructor(private readonly categories: CheckOffCategoryRepository) {}

  async execute(id: string, fields: CustomCheckOffCategoryFields): Promise<CustomCheckOffCategory> {
    const existing = await this.categories.findById(id);
    if (existing === null) {
      throw new DomainError('This category no longer exists.');
    }
    const edited = editCustomCheckOffCategory(existing, fields);
    assertCategoryNameIsFree(edited.name, await this.categories.findAll(), id);
    await this.categories.save(edited);
    return edited;
  }
}
