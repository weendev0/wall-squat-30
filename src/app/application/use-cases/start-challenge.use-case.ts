import { Challenge, createChallenge, DEFAULT_TARGET_SECONDS, DomainError } from '../../domain';
import { ChallengeRepository, Clock, IdGenerator } from '../ports';

/** BR-01, BR-02: starts a new 30-day challenge today with the chosen daily target. */
export class StartChallengeUseCase {
  constructor(
    private readonly challenges: ChallengeRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(targetSeconds: number = DEFAULT_TARGET_SECONDS): Promise<Challenge> {
    const active = await this.challenges.findActive();
    if (active !== null) {
      throw new DomainError('A challenge is already running. Finish it before starting a new one.');
    }

    const challenge = createChallenge({
      id: this.ids.newId(),
      startDate: this.clock.today(),
      targetSeconds,
    });
    await this.challenges.save(challenge);
    return challenge;
  }
}
