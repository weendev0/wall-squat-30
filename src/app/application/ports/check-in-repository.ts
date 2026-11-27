import { CheckIn } from '../../domain';

/** Stores the daily Done of check-off challenges (BR-14). */
export interface CheckInRepository {
  findByChallenge(challengeId: string): Promise<CheckIn[]>;
  /** The Done of one challenge day, or null when that day is not done yet. */
  findByDay(challengeId: string, dayNumber: number): Promise<CheckIn | null>;
  findAll(): Promise<CheckIn[]>;
  /** Inserts or replaces the check-in with the same id. */
  save(checkIn: CheckIn): Promise<void>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>;
}
