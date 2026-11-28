import {
  buildCheckOffDayResults,
  calculateProgress,
  ChallengeProgress,
  CheckIn,
  CheckOffChallenge,
  completeChallenge,
  CustomCheckOffCategory,
  DayResult,
  dayNumberOn,
  hasChallengeEnded,
  isCheckOffChallenge,
} from '../../domain';
import {
  ChallengeRepository,
  CheckInRepository,
  CheckOffCategoryRepository,
  Clock,
} from '../ports';

/** Everything the screens need about one check-off challenge, such as Reading or Water. */
export interface CheckOffOverview {
  readonly challenge: CheckOffChallenge;
  /** BR-21: the user's own category it belongs to, or null for Reading, Course and Study. */
  readonly customCategory: CustomCheckOffCategory | null;
  readonly days: readonly DayResult[];
  readonly progress: ChallengeProgress;
  /** Every recorded day of this challenge, newest day first (a counted day may be unfinished). */
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
    private readonly categories: CheckOffCategoryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<CheckOffOverview[]> {
    const today = this.clock.today();
    const all = (await this.challenges.findAll()).filter(isCheckOffChallenge);
    const challenges = await Promise.all(all.map((challenge) => this.completeIfEnded(challenge)));
    const checkIns = await this.checkIns.findAll();
    const categories = await this.categories.findAll();

    return challenges.sort(runningFirstThenNewest).map((challenge) => {
      const customCategory = categories.find(({ id }) => id === challenge.customCategoryId) ?? null;
      return toOverview(challenge, customCategory, checkIns, today);
    });
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
  customCategory: CustomCheckOffCategory | null,
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
    customCategory,
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
