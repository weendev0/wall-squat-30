import { ChallengeRepository, CheckInRepository } from '../ports';
import { findRunningCheckOffChallenge } from './find-check-off-challenge';

/**
 * BR-14: tapping Done again takes the day back to not done.
 * The note goes with it. Streak and totals follow automatically.
 */
export class UndoCheckInUseCase {
  constructor(
    private readonly challenges: ChallengeRepository,
    private readonly checkIns: CheckInRepository,
  ) {}

  async execute(challengeId: string, dayNumber: number): Promise<void> {
    const challenge = await findRunningCheckOffChallenge(this.challenges, challengeId);
    const checkIn = await this.checkIns.findByDay(challenge.id, dayNumber);
    if (checkIn !== null) {
      await this.checkIns.delete(checkIn.id);
    }
  }
}
