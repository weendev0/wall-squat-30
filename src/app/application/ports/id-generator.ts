/** Creates unique ids for new challenges and attempts. */
export interface IdGenerator {
  newId(): string;
}
