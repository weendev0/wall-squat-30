import { TestBed } from '@angular/core/testing';
import { RecordAttemptInput, RecordAttemptUseCase, StartChallengeUseCase } from '../../application';
import { addDays, TimedChallenge } from '../../domain';
import { setUpApp } from './screen-test-helpers';

type Fakes = ReturnType<typeof setUpApp>;

/** One hold of the made-up history: on which day, for how long, and when it was saved. */
export interface PastHold extends Omit<RecordAttemptInput, 'source' | 'challengeId'> {
  readonly dayNumber: number;
  readonly source?: 'timer' | 'manual';
  /** Saved this many days after its challenge day (a make-up). Default 0: on the day itself. */
  readonly savedDaysLater?: number;
}

/**
 * Starts a challenge on 16 Nov 2026 and records `holds` as if they happened on their days,
 * then leaves the clock on `todayDayNumber`. Returns the challenge, for its id.
 */
export async function createChallengeHistory(
  fakes: Fakes,
  holds: readonly PastHold[],
  todayDayNumber: number,
  targetSeconds = 60,
): Promise<TimedChallenge> {
  const startDate = '2026-11-16';
  fakes.clock.currentDate = startDate;
  const challenge = await TestBed.inject(StartChallengeUseCase).execute(targetSeconds);

  const recordAttempt = TestBed.inject(RecordAttemptUseCase);
  for (const hold of holds) {
    fakes.clock.currentDate = addDays(startDate, hold.dayNumber - 1 + (hold.savedDaysLater ?? 0));
    await recordAttempt.execute({
      ...hold,
      challengeId: challenge.id,
      source: hold.source ?? 'timer',
    });
  }
  fakes.clock.currentDate = addDays(startDate, todayDayNumber - 1);
  return challenge;
}
