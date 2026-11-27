import { AttemptRepository, ChallengeRepository } from '../ports';

/** BR-11: Settings > Reset all history. Deletes every challenge and attempt. */
export class ResetHistoryUseCase {
  constructor(
    private readonly challenges: ChallengeRepository,
    private readonly attempts: AttemptRepository,
  ) {}

  async execute(): Promise<void> {
    await this.attempts.deleteAll();
    await this.challenges.deleteAll();
  }
}
