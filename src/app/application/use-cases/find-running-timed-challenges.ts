import { isSameCategoryName, isTimedChallenge, TimedChallenge } from '../../domain';
import { ChallengeRepository } from '../ports';

/** BR-16: every timed challenge still running. Each has its own category. */
export async function findRunningTimedChallenges(
  challenges: ChallengeRepository,
): Promise<TimedChallenge[]> {
  const active = await challenges.findAllActive();
  return active.filter(isTimedChallenge);
}

/** BR-16: the running timed challenge of this category, or null when there is none. */
export async function findRunningInCategory(
  challenges: ChallengeRepository,
  category: string,
): Promise<TimedChallenge | null> {
  const running = await findRunningTimedChallenges(challenges);
  return running.find((challenge) => isSameCategoryName(challenge.name, category)) ?? null;
}
