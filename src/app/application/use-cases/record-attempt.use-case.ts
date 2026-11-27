import {
  Attempt,
  AttemptSource,
  createAttempt,
  dayNumberOn,
  DomainError,
  Feeling,
  isPersonalBest,
  isTooShortToKeep,
} from '../../domain';
import { AttemptRepository, ChallengeRepository, Clock, IdGenerator } from '../ports';
import { findActiveTimedChallenge } from './find-active-timed-challenge';

export interface RecordAttemptInput {
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
 * Saves a timed or hand-typed attempt into the active wall squat challenge.
 * - BR-05: a timed attempt under 5 seconds is discarded without an error.
 * - BR-07: an attempt for an earlier day is a make-up.
 * - BR-08: a manual attempt keeps source 'manual'.
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

    const challenge = await findActiveTimedChallenge(this.challenges);
    if (challenge === null) {
      throw new DomainError('Start a challenge before recording an attempt.');
    }

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

    const earlierAttempts = await this.attempts.findAll();
    await this.attempts.save(attempt);

    return {
      status: 'saved',
      attempt,
      isPersonalBest: isPersonalBest(attempt.durationSeconds, earlierAttempts),
    };
  }
}
