import {
  Attempt,
  buildDayResults,
  calculateProgress,
  ChallengeProgress,
  completeChallenge,
  DayResult,
  dayNumberOn,
  hasChallengeEnded,
  isTimedChallenge,
  LocalDate,
  TimedChallenge,
} from '../../domain';
import { AttemptRepository, ChallengeRepository, Clock } from '../ports';

/** Everything the Today, Progress and Celebration screens need about one timed challenge. */
export interface TimedOverview {
  readonly challenge: TimedChallenge;
  readonly days: readonly DayResult[];
  readonly progress: ChallengeProgress;
  readonly attempts: readonly Attempt[];
  /** Today's challenge day (1 to 30), or null once the challenge has ended. */
  readonly todayDayNumber: number | null;
  /** BR-10: true once, right after day 30, until the celebration has been shown. */
  readonly needsCelebration: boolean;
}

/**
 * Loads the timed challenges the screens show, with their calculated days and totals:
 * running ones first (BR-16), then finished ones still owing their celebration.
 * BR-10: a challenge past day 30 is completed here, the first time the app opens after it.
 */
export class GetTimedOverviewsUseCase {
  constructor(
    private readonly challenges: ChallengeRepository,
    private readonly attempts: AttemptRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<TimedOverview[]> {
    const today = this.clock.today();
    const all = (await this.challenges.findAll()).filter(isTimedChallenge);
    const shown = all.filter((c) => c.status === 'active' || !c.celebrationShown);
    const challenges = await Promise.all(shown.map((c) => this.completeIfEnded(c, today)));
    const attempts = await this.attempts.findAll();

    return challenges
      .sort(runningFirstThenOldest)
      .map((challenge) => toOverview(challenge, attempts, today));
  }

  private async completeIfEnded(
    challenge: TimedChallenge,
    today: LocalDate,
  ): Promise<TimedChallenge> {
    if (challenge.status !== 'active' || !hasChallengeEnded(challenge, today)) {
      return challenge;
    }
    const completed = completeChallenge(challenge, today);
    await this.challenges.save(completed);
    return completed;
  }
}

function toOverview(
  challenge: TimedChallenge,
  allAttempts: readonly Attempt[],
  today: LocalDate,
): TimedOverview {
  const attempts = allAttempts.filter((attempt) => attempt.challengeId === challenge.id);
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

/** Running first; among them the one started first, so the wall squat keeps its place on top. */
function runningFirstThenOldest(a: TimedChallenge, b: TimedChallenge): number {
  const aRuns = a.status === 'active' ? 0 : 1;
  const bRuns = b.status === 'active' ? 0 : 1;
  return aRuns - bRuns || a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id);
}
