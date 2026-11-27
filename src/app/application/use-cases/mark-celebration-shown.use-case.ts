import { DomainError, markCelebrationShown } from '../../domain';
import { ChallengeRepository } from '../ports';

/** BR-10: called after the celebration screen, so it never appears twice. */
export class MarkCelebrationShownUseCase {
  constructor(private readonly challenges: ChallengeRepository) {}

  async execute(challengeId: string): Promise<void> {
    const challenge = await this.challenges.findById(challengeId);
    if (challenge === null) {
      throw new DomainError('That challenge no longer exists.');
    }
    await this.challenges.save(markCelebrationShown(challenge));
  }
}
