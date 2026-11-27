import {
  AttemptRepository,
  ChallengeRepository,
  CheckInRepository,
  TimedCategoryRepository,
} from '../ports';

/** BR-11: Settings > Reset all history. Deletes every challenge, attempt, check-in
 * and saved timed category (BR-15). */
export class ResetHistoryUseCase {
  constructor(
    private readonly challenges: ChallengeRepository,
    private readonly attempts: AttemptRepository,
    private readonly checkIns: CheckInRepository,
    private readonly categories: TimedCategoryRepository,
  ) {}

  async execute(): Promise<void> {
    await this.attempts.deleteAll();
    await this.checkIns.deleteAll();
    await this.challenges.deleteAll();
    await this.categories.deleteAll();
  }
}
