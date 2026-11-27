import { CheckOffChallenge, isMakeUpDay } from './challenge';
import { LocalDate } from './local-date';
import { cleanNote } from './note';

/** BR-14: the daily Done of a check-off challenge. At most one per challenge day. */
export interface CheckIn {
  readonly id: string;
  readonly challengeId: string;
  /** The challenge day this Done counts for (1 to 30). */
  readonly dayNumber: number;
  /** The day Done was tapped. Later than the day itself means a make-up (BR-17). */
  readonly recordedOn: LocalDate;
  /** BR-17: tapped on a later date than the day it counts for. */
  readonly isMakeUp: boolean;
  /** BR-15: optional thoughts for the day. Empty when there is none. */
  readonly note: string;
}

export interface NewCheckInInput {
  readonly id: string;
  readonly challenge: CheckOffChallenge;
  readonly dayNumber: number;
  readonly recordedOn: LocalDate;
  readonly note?: string;
}

/**
 * Creates the Done of one day after checking the rules:
 * - a day can never be in the future (BR-14)
 * - an earlier day is a make-up (BR-17)
 * - the note is optional and trimmed (BR-15)
 */
export function createCheckIn(input: NewCheckInInput): CheckIn {
  return {
    id: input.id,
    challengeId: input.challenge.id,
    dayNumber: input.dayNumber,
    recordedOn: input.recordedOn,
    isMakeUp: isMakeUpDay(input.challenge, input.dayNumber, input.recordedOn),
    note: cleanNote(input.note),
  };
}

/** BR-15: the note can be changed later; the rest of the check-in stays as it was. */
export function withNote(checkIn: CheckIn, note: string): CheckIn {
  return { ...checkIn, note: cleanNote(note) };
}
