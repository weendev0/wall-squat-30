import { AttemptRepository } from '../../application';
import { Attempt } from '../../domain';
import { WallSquatDatabase } from './wall-squat-database';

/** Stores attempts in IndexedDB on the phone. */
export class DexieAttemptRepository implements AttemptRepository {
  constructor(private readonly database: WallSquatDatabase) {}

  async findByChallenge(challengeId: string): Promise<Attempt[]> {
    return this.database.attempts.where('challengeId').equals(challengeId).toArray();
  }

  async findAll(): Promise<Attempt[]> {
    return this.database.attempts.toArray();
  }

  async findById(id: string): Promise<Attempt | null> {
    return (await this.database.attempts.get(id)) ?? null;
  }

  async save(attempt: Attempt): Promise<void> {
    await this.database.attempts.put(attempt);
  }

  async delete(id: string): Promise<void> {
    await this.database.attempts.delete(id);
  }

  async deleteAll(): Promise<void> {
    await this.database.attempts.clear();
  }
}
