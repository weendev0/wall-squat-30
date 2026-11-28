import { CheckOffCategoryRepository } from '../../application';
import { CustomCheckOffCategory } from '../../domain';
import { StoredCheckOffCategory, WallSquatDatabase } from './wall-squat-database';

/** Stores the user's own daily check-off categories (BR-21) in IndexedDB. */
export class DexieCheckOffCategoryRepository implements CheckOffCategoryRepository {
  constructor(private readonly database: WallSquatDatabase) {}

  async findAll(): Promise<CustomCheckOffCategory[]> {
    const stored = await this.database.checkOffCategories.orderBy('order').toArray();
    return stored.map(withoutOrder);
  }

  async findById(id: string): Promise<CustomCheckOffCategory | null> {
    const stored = await this.database.checkOffCategories.get(id);
    return stored ? withoutOrder(stored) : null;
  }

  /** A new category goes to the end; an edited one keeps its place. */
  async save(category: CustomCheckOffCategory): Promise<void> {
    const table = this.database.checkOffCategories;
    await this.database.transaction('rw', table, async () => {
      const existing = await table.get(category.id);
      const order = existing?.order ?? (await table.count());
      await table.put({ ...category, order });
    });
  }

  async delete(id: string): Promise<void> {
    await this.database.checkOffCategories.delete(id);
  }

  async deleteAll(): Promise<void> {
    await this.database.checkOffCategories.clear();
  }
}

/** The order is only for sorting; the rest of the app never sees it. */
function withoutOrder({
  order: _order,
  ...category
}: StoredCheckOffCategory): CustomCheckOffCategory {
  return category;
}
