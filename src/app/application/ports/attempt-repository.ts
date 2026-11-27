import { Attempt } from '../../domain';

/** Stores attempts. The application layer only knows this interface, not IndexedDB. */
export interface AttemptRepository {
  findByChallenge(challengeId: string): Promise<Attempt[]>;
  findAll(): Promise<Attempt[]>;
  findById(id: string): Promise<Attempt | null>;
  save(attempt: Attempt): Promise<void>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>;
}
