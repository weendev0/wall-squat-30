import { CheckOffChallenge, DomainError, isCheckOffChallenge } from '../../domain';
import { ChallengeRepository } from '../ports';

/** The running check-off challenge with this id, or a clear error when there is none. */
export async function findRunningCheckOffChallenge(
  challenges: ChallengeRepository,
  challengeId: string,
): Promise<CheckOffChallenge> {
  const challenge = await challenges.findById(challengeId);
  if (challenge === null || !isCheckOffChallenge(challenge)) {
    throw new DomainError('That challenge no longer exists.');
  }
  if (challenge.status !== 'active') {
    throw new DomainError('That challenge has finished.');
  }
  return challenge;
}
