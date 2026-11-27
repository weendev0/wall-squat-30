import { MAX_NOTE_LENGTH } from './challenge-rules.constants';
import { DomainError } from './domain-error';

/** Trims a note and checks its length. BR-15. Shared by check-ins and attempts. */
export function cleanNote(note: string | undefined): string {
  const trimmed = (note ?? '').trim();
  if (trimmed.length > MAX_NOTE_LENGTH) {
    throw new DomainError(`A note can be at most ${MAX_NOTE_LENGTH} characters.`);
  }
  return trimmed;
}
