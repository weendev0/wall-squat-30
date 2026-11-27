import { AttemptRepository, ChallengeRepository, CheckInRepository } from '../ports';

/** BR-11: Settings > Reset all history. Deletes every challenge, attempt and check-in. */
export class ResetHistoryUseCase {
  constructor(
    private readonly challenges: ChallengeRepository,
    private readonly attempts: AttemptRepository,
    private readonly checkIns: CheckInRepository,
  ) {}

  async execute(): Promise<void> {
    await this.attempts.deleteAll();
    await this.checkIns.deleteAll();
    await this.challenges.deleteAll();
  }
}
