import { CustomCheckOffCategory, isCheckOffChallenge } from '../../domain';
import { ChallengeRepository, CheckOffCategoryRepository } from '../ports';

/** A category of the user's own, as New challenge offers it. */
export interface CheckOffCategoryOption {
  readonly category: CustomCheckOffCategory;
  /** BR-24: a category used by any challenge, running or finished, cannot be deleted. */
  readonly isInUse: boolean;
}

/** BR-21, BR-24: the user's own check-off categories, in the order they were added. */
export class GetCheckOffCategoriesUseCase {
  constructor(
    private readonly categories: CheckOffCategoryRepository,
    private readonly challenges: ChallengeRepository,
  ) {}

  async execute(): Promise<CheckOffCategoryOption[]> {
    const usedIds = await findUsedCategoryIds(this.challenges);
    const categories = await this.categories.findAll();
    return categories.map((category) => ({ category, isInUse: usedIds.has(category.id) }));
  }
}

/** The ids of every category that a challenge, running or finished, belongs to. */
export async function findUsedCategoryIds(challenges: ChallengeRepository): Promise<Set<string>> {
  const all = (await challenges.findAll()).filter(isCheckOffChallenge);
  return new Set(all.flatMap((challenge) => challenge.customCategoryId ?? []));
}
