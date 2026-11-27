import { CheckOffCategory, CheckOffChallenge, createCheckOffChallenge } from '../../domain';
import { ChallengeRepository, Clock, IdGenerator } from '../ports';

export interface StartCheckOffChallengeInput {
  readonly name: string;
  readonly category: CheckOffCategory;
}

/**
 * BR-13, BR-14: starts a new 30-day Reading, Course or Study challenge today.
 * It runs beside any other challenge, each with its own start date.
 */
export class StartCheckOffChallengeUseCase {
  constructor(
    private readonly challenges: ChallengeRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: StartCheckOffChallengeInput): Promise<CheckOffChallenge> {
    const challenge = createCheckOffChallenge({
      id: this.ids.newId(),
      startDate: this.clock.today(),
      name: input.name,
      category: input.category,
    });
    await this.challenges.save(challenge);
    return challenge;
  }
}
