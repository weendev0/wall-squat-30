import { isTimedChallenge, TimedChallenge } from '../../domain';
import { ChallengeRepository } from '../ports';

/**
 * The running wall squat challenge, or null when there is none.
 * Several challenges can run at once (BR-13), but only one of them is timed.
 */
export async function findActiveTimedChallenge(
  challenges: ChallengeRepository,
): Promise<TimedChallenge | null> {
  const active = await challenges.findAllActive();
  return active.find(isTimedChallenge) ?? null;
}
