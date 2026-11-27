import {
  Attempt,
  buildDayResults,
  calculateProgress,
  Challenge,
  ChallengeProgress,
  completeChallenge,
  DayResult,
  dayNumberOn,
  hasChallengeEnded,
} from '../../domain';
import { AttemptRepository, ChallengeRepository, Clock } from '../ports';

/** Everything the Today, Progress and Celebration screens need, in one object. */
export interface ChallengeOverview {
  readonly challenge: Challenge;
  readonly days: readonly DayResult[];
  readonly progress: ChallengeProgress;
  readonly attempts: readonly Attempt[];
  /** Today's challenge day (1 to 30), or null once the challenge has ended. */
  readonly todayDayNumber: number | null;
  /** BR-10: true once, right after day 30, until the celebration has been shown. */
  readonly needsCelebration: boolean;
}

/**
 * Loads the current challenge with its calculated days and totals.
 * Returns null when there is nothing to show, so the app opens New challenge.
 * BR-10: a challenge past day 30 is completed here, the first time the app opens after it.
 */
export class GetChallengeOverviewUseCase {
  constructor(
    private readonly challenges: ChallengeRepository,
    private readonly attempts: AttemptRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<ChallengeOverview | null> {
    const today = this.clock.today();
    const challenge = await this.findChallengeToShow(today);
    if (challenge === null) {
      return null;
    }

    const attempts = await this.attempts.findByChallenge(challenge.id);
    const days = buildDayResults(challenge, attempts, today);
    const isActive = challenge.status === 'active';

    return {
      challenge,
      days,
      progress: calculateProgress(days, attempts, today),
      attempts,
      todayDayNumber: isActive ? dayNumberOn(challenge, today) : null,
      needsCelebration: !isActive && !challenge.celebrationShown,
    };
  }

  /** The active challenge, or a just-finished one that still owes its celebration. */
  private async findChallengeToShow(today: string): Promise<Challenge | null> {
    const active = await this.challenges.findActive();
    if (active !== null) {
      if (!hasChallengeEnded(active, today)) {
        return active;
      }
      const completed = completeChallenge(active, today);
      await this.challenges.save(completed);
      return completed;
    }

    const all = await this.challenges.findAll();
    return all.find((challenge) => !challenge.celebrationShown) ?? null;
  }
}
