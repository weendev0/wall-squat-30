import { timedCategoryNames } from '../../domain';
import { TimedCategoryRepository } from '../ports';

/** BR-15: the category names New challenge offers, Wall Squat first. */
export class GetTimedCategoriesUseCase {
  constructor(private readonly categories: TimedCategoryRepository) {}

  async execute(): Promise<string[]> {
    return timedCategoryNames(await this.categories.findAll());
  }
}
