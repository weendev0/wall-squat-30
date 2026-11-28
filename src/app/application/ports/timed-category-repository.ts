import { TimedCategory } from '../../domain';

/** Stores the categories the user added for timed challenges (BR-15). */
export interface TimedCategoryRepository {
  /** Every saved category, oldest first. */
  findAll(): Promise<TimedCategory[]>;
  save(category: TimedCategory): Promise<void>;
  deleteAll(): Promise<void>;
}
