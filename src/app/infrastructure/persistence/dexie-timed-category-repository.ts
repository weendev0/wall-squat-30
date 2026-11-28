import { TimedCategoryRepository } from '../../application';
import { TimedCategory } from '../../domain';
import { WallSquatDatabase } from './wall-squat-database';

/** Stores the categories the user added for timed challenges (BR-15) in IndexedDB. */
export class DexieTimedCategoryRepository implements TimedCategoryRepository {
  constructor(private readonly database: WallSquatDatabase) {}

  async findAll(): Promise<TimedCategory[]> {
    const stored = await this.database.timedCategories.orderBy('order').toArray();
    return stored.map(({ id, name }) => ({ id, name }));
  }

  async save(category: TimedCategory): Promise<void> {
    await this.database.transaction('rw', this.database.timedCategories, async () => {
      const order = await this.database.timedCategories.count();
      await this.database.timedCategories.put({ ...category, order });
    });
  }

  async deleteAll(): Promise<void> {
    await this.database.timedCategories.clear();
  }
}
