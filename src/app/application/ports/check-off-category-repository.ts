import { CustomCheckOffCategory } from '../../domain';

/** Stores the daily check-off categories the user added, such as Water Drinking (BR-21). */
export interface CheckOffCategoryRepository {
  /** Every saved category, in the order they were added. */
  findAll(): Promise<CustomCheckOffCategory[]>;
  findById(id: string): Promise<CustomCheckOffCategory | null>;
  /** Adds a new category at the end, or replaces the one with the same id in its place. */
  save(category: CustomCheckOffCategory): Promise<void>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>;
}
