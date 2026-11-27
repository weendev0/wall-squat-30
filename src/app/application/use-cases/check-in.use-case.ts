import { CheckIn, createCheckIn, dayNumberOn, DomainError, withNote } from '../../domain';
import { ChallengeRepository, CheckInRepository, Clock, IdGenerator } from '../ports';
import { findRunningCheckOffChallenge } from './find-check-off-challenge';

export interface CheckInInput {
  readonly challengeId: string;
  /** Leave out for today. An earlier day makes it a make-up (BR-17). */
  readonly dayNumber?: number;
  /** BR-15: optional. Leave out to keep the note the day already has. */
  readonly note?: string;
}

/**
 * The Save on the Check-in screen.
 * - BR-14: marks the day as done. A day is done at most once, so a second Save
 *   only updates the note of the existing check-in.
 * - BR-15: saves the optional note with it.
 * - BR-17: an earlier day is saved as a make-up.
 */
export class CheckInUseCase {
  constructor(
    private readonly challenges: ChallengeRepository,
    private readonly checkIns: CheckInRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CheckInInput): Promise<CheckIn> {
    const challenge = await findRunningCheckOffChallenge(this.challenges, input.challengeId);
    const today = this.clock.today();
    const dayNumber = input.dayNumber ?? dayNumberOn(challenge, today);
    if (dayNumber === null) {
      throw new DomainError('Today is outside the challenge.');
    }

    const existing = await this.checkIns.findByDay(challenge.id, dayNumber);
    const checkIn =
      existing === null
        ? createCheckIn({
            id: this.ids.newId(),
            challenge,
            dayNumber,
            recordedOn: today,
            note: input.note,
          })
        : withNote(existing, input.note ?? existing.note);

    await this.checkIns.save(checkIn);
    return checkIn;
  }
}
