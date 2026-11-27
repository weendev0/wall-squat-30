import {
  buildCheckOffDayResults,
  calculateProgress,
  ChallengeProgress,
  CheckIn,
  CheckOffChallenge,
  completeChallenge,
  DayResult,
  dayNumberOn,
  hasChallengeEnded,
  isCheckOffChallenge,
} from '../../domain';
import { ChallengeRepository, CheckInRepository, Clock } from '../ports';

/** Everything the screens need about one Reading, Course or Study challenge. */
export interface CheckOffOverview {
  readonly challenge: CheckOffChallenge;
  readonly days: readonly DayResult[];
  readonly progress: ChallengeProgress;
  /** Every Done of this challenge, newest day first. */
  readonly checkIns: readonly CheckIn[];
  /** Today's challenge day (1 to 30), or null once the challenge has ended. */
  readonly todayDayNumber: number | null;
  /** BR-10, BR-18: true once, right after day 30, until the celebration has been shown. */
  readonly needsCelebration: boolean;
}

/**
 * Loads every check-off challenge with its calculated days and totals:
 * running ones first (newest start first), then finished ones.
 * BR-18: a challenge past day 30 is completed here, the first time the app opens after it.
 */
export class GetCheckOffOverviewsUseCase {
  constructor(
    private readonly challenges: ChallengeRepository,
    private readonly checkIns: CheckInRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<CheckOffOverview[]> {
    const today = this.clock.today();
    const all = (await this.challenges.findAll()).filter(isCheckOffChallenge);
    const challenges = await Promise.all(all.map((challenge) => this.completeIfEnded(challenge)));
    const checkIns = await this.checkIns.findAll();

    return challenges
      .sort(runningFirstThenNewest)
      .map((challenge) => toOverview(challenge, checkIns, today));
  }

  private async completeIfEnded(challenge: CheckOffChallenge): Promise<CheckOffChallenge> {
    const today = this.clock.today();
    if (challenge.status !== 'active' || !hasChallengeEnded(challenge, today)) {
      return challenge;
    }
    const completed = completeChallenge(challenge, today);
    await this.challenges.save(completed);
    return completed;
  }
}

function toOverview(
  challenge: CheckOffChallenge,
  allCheckIns: readonly CheckIn[],
  today: string,
): CheckOffOverview {
  const checkIns = allCheckIns
    .filter((checkIn) => checkIn.challengeId === challenge.id)
    .sort((a, b) => b.dayNumber - a.dayNumber);
  const days = buildCheckOffDayResults(challenge, checkIns, today);
  const isActive = challenge.status === 'active';

  return {
    challenge,
    days,
    progress: calculateProgress(days, [], today),
    checkIns,
    todayDayNumber: isActive ? dayNumberOn(challenge, today) : null,
    needsCelebration: !isActive && !challenge.celebrationShown,
  };
}

function runningFirstThenNewest(a: CheckOffChallenge, b: CheckOffChallenge): number {
  const aRuns = a.status === 'active' ? 0 : 1;
  const bRuns = b.status === 'active' ? 0 : 1;
  return aRuns - bRuns || b.startDate.localeCompare(a.startDate);
}
