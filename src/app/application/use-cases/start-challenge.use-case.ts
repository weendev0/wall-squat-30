import {
  createTimedChallenge,
  DEFAULT_TARGET_SECONDS,
  DomainError,
  TimedChallenge,
  WALL_SQUAT_NAME,
} from '../../domain';
import { ChallengeRepository, Clock, IdGenerator } from '../ports';
import { findRunningInCategory } from './find-running-timed-challenges';

/**
 * BR-01, BR-02: starts a new 30-day timed challenge today with the chosen daily target.
 * BR-15, BR-16: the category is its name; several categories may run at once,
 * but only one challenge per category.
 */
export class StartChallengeUseCase {
  constructor(
    private readonly challenges: ChallengeRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(
    targetSeconds: number = DEFAULT_TARGET_SECONDS,
    category: string = WALL_SQUAT_NAME,
  ): Promise<TimedChallenge> {
    const challenge = createTimedChallenge({
      id: this.ids.newId(),
      startDate: this.clock.today(),
      targetSeconds,
      name: category,
    });

    const running = await findRunningInCategory(this.challenges, challenge.name);
    if (running !== null) {
      throw new DomainError(
        `A ${running.name} challenge is already running. Finish it before starting a new one.`,
      );
    }

    await this.challenges.save(challenge);
    return challenge;
  }
}
