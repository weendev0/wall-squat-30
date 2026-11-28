import {
  AttemptRepository,
  ChallengeRepository,
  CheckInRepository,
  CheckOffCategoryRepository,
  TimedCategoryRepository,
} from '../ports';

/**
 * BR-11: Settings > Reset all history. Deletes every challenge, attempt, check-in,
 * saved timed category (BR-15) and check-off category of the user's own (BR-24).
 */
export class ResetHistoryUseCase {
  constructor(
    private readonly challenges: ChallengeRepository,
    private readonly attempts: AttemptRepository,
    private readonly checkIns: CheckInRepository,
    private readonly timedCategories: TimedCategoryRepository,
    private readonly checkOffCategories: CheckOffCategoryRepository,
  ) {}

  async execute(): Promise<void> {
    await this.attempts.deleteAll();
    await this.checkIns.deleteAll();
    await this.challenges.deleteAll();
    await this.timedCategories.deleteAll();
    await this.checkOffCategories.deleteAll();
  }
}
