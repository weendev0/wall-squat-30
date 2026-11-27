import {
  Attempt,
  buildDayResults,
  DayStatus,
  isTimedChallenge,
  LocalDate,
  TimedChallenge,
} from '../../domain';
import { AttemptRepository, ChallengeRepository, Clock } from '../ports';

/** One challenge day that has attempts, as listed on All sessions. */
export interface SessionDay {
  readonly dayNumber: number;
  readonly date: LocalDate;
  readonly status: DayStatus;
  /** BR-03: the best attempt counts for the day. */
  readonly bestSeconds: number;
  /** Every attempt of the day, longest first. */
  readonly attempts: readonly Attempt[];
}

/** All sessions of one challenge. */
export interface ChallengeSessions {
  readonly challenge: TimedChallenge;
  /** Only days with attempts, newest day first. */
  readonly days: readonly SessionDay[];
  readonly attemptCount: number;
  /** Past days without any attempt. */
  readonly missedDayCount: number;
}

/**
 * The full history for the All sessions screen: every timed challenge, newest first,
 * with its attempts grouped by day. Nothing is filtered here; the screen does that.
 */
export class GetSessionHistoryUseCase {
  constructor(
    private readonly challenges: ChallengeRepository,
    private readonly attempts: AttemptRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<ChallengeSessions[]> {
    const today = this.clock.today();
    const challenges = await this.challenges.findAll();
    const attempts = await this.attempts.findAll();

    return challenges
      .filter(isTimedChallenge)
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .map((challenge) => {
        const ownAttempts = attempts.filter((attempt) => attempt.challengeId === challenge.id);
        return toChallengeSessions(challenge, ownAttempts, today);
      });
  }
}

function toChallengeSessions(
  challenge: TimedChallenge,
  attempts: readonly Attempt[],
  today: LocalDate,
): ChallengeSessions {
  const dayResults = buildDayResults(challenge, attempts, today);
  const days: SessionDay[] = dayResults
    .filter((day) => day.attemptCount > 0)
    .reverse()
    .map((day) => ({
      dayNumber: day.dayNumber,
      date: day.date,
      status: day.status,
      bestSeconds: day.bestSeconds ?? 0,
      attempts: attempts
        .filter((attempt) => attempt.dayNumber === day.dayNumber)
        .sort((a, b) => b.durationSeconds - a.durationSeconds),
    }));

  return {
    challenge,
    days,
    attemptCount: attempts.length,
    missedDayCount: dayResults.filter((day) => day.status === 'missed').length,
  };
}
