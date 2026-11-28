import {
  Attempt,
  AttemptSource,
  createAttempt,
  dayNumberOn,
  DomainError,
  Feeling,
  isPersonalBest,
  isSameCategoryName,
  isTimedChallenge,
  isTooShortToKeep,
  TimedChallenge,
} from '../../domain';
import { AttemptRepository, ChallengeRepository, Clock, IdGenerator } from '../ports';

export interface RecordAttemptInput {
  /** BR-16: the running timed challenge the attempt belongs to. */
  readonly challengeId: string;
  readonly durationSeconds: number;
  readonly source: AttemptSource;
  /** Leave out to record for today. A past day makes it a make-up (BR-07). */
  readonly dayNumber?: number;
  readonly feeling?: Feeling;
  readonly note?: string;
}

export type RecordAttemptResult =
  | { readonly status: 'too-short' }
  | { readonly status: 'saved'; readonly attempt: Attempt; readonly isPersonalBest: boolean };

/**
 * Saves a timed or hand-typed attempt into a running timed challenge.
 * - BR-05: a timed attempt under 5 seconds is discarded without an error.
 * - BR-07: an attempt for an earlier day is a make-up.
 * - BR-08: a manual attempt keeps source 'manual'.
 * - BR-17: a personal best is compared within the same category only, so a long plank
 *   does not hide a wall squat record.
 */
export class RecordAttemptUseCase {
  constructor(
    private readonly challenges: ChallengeRepository,
    private readonly attempts: AttemptRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: RecordAttemptInput): Promise<RecordAttemptResult> {
    if (input.source === 'timer' && isTooShortToKeep(input.durationSeconds)) {
      return { status: 'too-short' };
    }

    const challenge = await this.findRunningChallenge(input.challengeId);

    const today = this.clock.today();
    const dayNumber = input.dayNumber ?? dayNumberOn(challenge, today);
    if (dayNumber === null) {
      throw new DomainError('Today is outside the challenge.');
    }

    const attempt = createAttempt({
      id: this.ids.newId(),
      challenge,
      dayNumber,
      recordedOn: today,
      durationSeconds: input.durationSeconds,
      source: input.source,
      feeling: input.feeling,
      note: input.note,
    });

    const earlierAttempts = await this.attemptsInSameCategory(challenge);
    await this.attempts.save(attempt);

    return {
      status: 'saved',
      attempt,
      isPersonalBest: isPersonalBest(attempt.durationSeconds, earlierAttempts),
    };
  }

  private async findRunningChallenge(challengeId: string): Promise<TimedChallenge> {
    const challenge = await this.challenges.findById(challengeId);
    if (challenge === null || !isTimedChallenge(challenge)) {
      throw new DomainError('Start a timed challenge before recording an attempt.');
    }
    return challenge;
  }

  private async attemptsInSameCategory(challenge: TimedChallenge): Promise<Attempt[]> {
    const sameCategoryIds = new Set(
      (await this.challenges.findAll())
        .filter(isTimedChallenge)
        .filter((other) => isSameCategoryName(other.name, challenge.name))
        .map((other) => other.id),
    );
    const all = await this.attempts.findAll();
    return all.filter((attempt) => sameCategoryIds.has(attempt.challengeId));
  }
}
