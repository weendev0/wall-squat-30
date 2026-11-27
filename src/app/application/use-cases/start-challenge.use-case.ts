import {
  createTimedChallenge,
  DEFAULT_TARGET_SECONDS,
  WALL_SQUAT_NAME,
  DomainError,
  TimedChallenge,
} from '../../domain';
import { ChallengeRepository, Clock, IdGenerator } from '../ports';
import { findActiveTimedChallenge } from './find-active-timed-challenge';

/**
 * BR-01, BR-02: starts a new 30-day wall squat challenge today with the chosen daily target.
 * Check-off challenges may run beside it (BR-13), but only one timed challenge at a time.
 */
export class StartChallengeUseCase {
  constructor(
    private readonly challenges: ChallengeRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(
    targetSeconds: number = DEFAULT_TARGET_SECONDS,
    name: string = WALL_SQUAT_NAME,
  ): Promise<TimedChallenge> {
    const active = await findActiveTimedChallenge(this.challenges);
    if (active !== null) {
      throw new DomainError(
        'A timed challenge is already running. Finish it before starting a new one.',
      );
    }

    const challenge = createTimedChallenge({
      id: this.ids.newId(),
      startDate: this.clock.today(),
      targetSeconds,
      name,
    });
    await this.challenges.save(challenge);
    return challenge;
  }
}
