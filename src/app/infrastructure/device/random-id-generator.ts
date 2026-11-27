import { IdGenerator } from '../../application';

/** Random ids from the browser's built-in UUID generator. */
export class RandomIdGenerator implements IdGenerator {
  newId(): string {
    return crypto.randomUUID();
  }
}
