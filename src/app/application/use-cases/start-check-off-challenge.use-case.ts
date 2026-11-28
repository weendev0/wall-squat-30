import {
  BuiltInCheckOffCategory,
  CheckOffChallenge,
  createCheckOffChallenge,
  createCustomCheckOffChallenge,
  DomainError,
} from '../../domain';
import { ChallengeRepository, CheckOffCategoryRepository, Clock, IdGenerator } from '../ports';

/** Start a challenge in a built-in category, such as Reading. */
export interface StartBuiltInCheckOffInput {
  readonly name: string;
  readonly category: BuiltInCheckOffCategory;
}

/** Start a challenge in a category of the user's own, such as Water Drinking (BR-21). */
export interface StartCustomCheckOffInput {
  readonly name: string;
  readonly customCategoryId: string;
}

export type StartCheckOffChallengeInput = StartBuiltInCheckOffInput | StartCustomCheckOffInput;

/**
 * BR-13, BR-14, BR-21: starts a new 30-day check-off challenge today.
 * It runs beside any other challenge, each with its own start date.
 * A challenge in the user's own category copies that category's daily goal (BR-22).
 */
export class StartCheckOffChallengeUseCase {
  constructor(
    private readonly challenges: ChallengeRepository,
    private readonly categories: CheckOffCategoryRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: StartCheckOffChallengeInput): Promise<CheckOffChallenge> {
    const challenge =
      'customCategoryId' in input
        ? await this.createCustom(input)
        : createCheckOffChallenge({ ...this.newChallengeBase(), ...input });
    await this.challenges.save(challenge);
    return challenge;
  }

  private async createCustom(input: StartCustomCheckOffInput): Promise<CheckOffChallenge> {
    const category = await this.categories.findById(input.customCategoryId);
    if (category === null) {
      throw new DomainError('This category no longer exists.');
    }
    return createCustomCheckOffChallenge({
      ...this.newChallengeBase(),
      name: input.name,
      category,
    });
  }

  private newChallengeBase() {
    return { id: this.ids.newId(), startDate: this.clock.today() };
  }
}
