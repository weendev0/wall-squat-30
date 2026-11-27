import { Challenge } from '../../domain';

/** Stores challenges. The application layer only knows this interface, not IndexedDB. */
export interface ChallengeRepository {
  /** The one active challenge, or null when there is none. */
  findActive(): Promise<Challenge | null>;
  findById(id: string): Promise<Challenge | null>;
  /** Every challenge, newest start date first. */
  findAll(): Promise<Challenge[]>;
  /** Inserts or replaces the challenge with the same id. */
  save(challenge: Challenge): Promise<void>;
  deleteAll(): Promise<void>;
}
