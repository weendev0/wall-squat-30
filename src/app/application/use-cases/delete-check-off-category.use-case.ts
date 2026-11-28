import { DomainError } from '../../domain';
import { ChallengeRepository, CheckOffCategoryRepository } from '../ports';
import { findUsedCategoryIds } from './get-check-off-categories.use-case';

/** BR-24: deletes a category of the user's own, but only when no challenge uses it. */
export class DeleteCheckOffCategoryUseCase {
  constructor(
    private readonly categories: CheckOffCategoryRepository,
    private readonly challenges: ChallengeRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const usedIds = await findUsedCategoryIds(this.challenges);
    if (usedIds.has(id)) {
      throw new DomainError('A challenge uses this category, so it stays to keep your history.');
    }
    await this.categories.delete(id);
  }
}
