import { ChallengeRepository } from '../../application';
import { Challenge } from '../../domain';
import { WallSquatDatabase } from './wall-squat-database';

/** Stores challenges in IndexedDB on the phone. */
export class DexieChallengeRepository implements ChallengeRepository {
  constructor(private readonly database: WallSquatDatabase) {}

  async findActive(): Promise<Challenge | null> {
    const active = await this.database.challenges.where('status').equals('active').first();
    return active ?? null;
  }

  async findById(id: string): Promise<Challenge | null> {
    return (await this.database.challenges.get(id)) ?? null;
  }

  async findAll(): Promise<Challenge[]> {
    return this.database.challenges.orderBy('startDate').reverse().toArray();
  }

  async save(challenge: Challenge): Promise<void> {
    await this.database.challenges.put(challenge);
  }

  async deleteAll(): Promise<void> {
    await this.database.challenges.clear();
  }
}
