import { CheckInRepository } from '../../application';
import { CheckIn } from '../../domain';
import { WallSquatDatabase } from './wall-squat-database';

/** Stores the daily Done of check-off challenges in IndexedDB on the phone. */
export class DexieCheckInRepository implements CheckInRepository {
  constructor(private readonly database: WallSquatDatabase) {}

  async findByChallenge(challengeId: string): Promise<CheckIn[]> {
    return this.database.checkIns.where('challengeId').equals(challengeId).toArray();
  }

  async findByDay(challengeId: string, dayNumber: number): Promise<CheckIn | null> {
    const checkIn = await this.database.checkIns
      .where('[challengeId+dayNumber]')
      .equals([challengeId, dayNumber])
      .first();
    return checkIn ?? null;
  }

  async findAll(): Promise<CheckIn[]> {
    return this.database.checkIns.toArray();
  }

  async save(checkIn: CheckIn): Promise<void> {
    await this.database.checkIns.put(checkIn);
  }

  async delete(id: string): Promise<void> {
    await this.database.checkIns.delete(id);
  }

  async deleteAll(): Promise<void> {
    await this.database.checkIns.clear();
  }
}
