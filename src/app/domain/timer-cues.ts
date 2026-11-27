/**
 * Which sounds the timer plays, and when (spec section 4).
 *
 * - 'halfway': one short beep at 0:30, only when the target is longer than 30 seconds
 * - 'tick': three short ticks in the last 3 seconds before the target (for 1:00: 0:57, 0:58, 0:59)
 * - 'target': one long beep when the target is reached; the timer keeps counting after it
 *
 * The get-ready countdown before the timer starts is separate: see countdownCueFor.
 */
export type TimerCue = 'halfway' | 'tick' | 'target';

export interface ScheduledCue {
  readonly atSecond: number;
  readonly cue: TimerCue;
}

const HALFWAY_CUE_SECOND = 30;
const FINAL_TICK_COUNT = 3;

/** The get-ready countdown before the timer starts: 3, 2, 1, go. */
export const COUNTDOWN_SECONDS = 3;

/** Every cue of a hold with this target, in time order. */
export function cuePlanFor(targetSeconds: number): ScheduledCue[] {
  const plan: ScheduledCue[] = [];

  if (targetSeconds > HALFWAY_CUE_SECOND) {
    plan.push({ atSecond: HALFWAY_CUE_SECOND, cue: 'halfway' });
  }
  for (let secondsLeft = FINAL_TICK_COUNT; secondsLeft >= 1; secondsLeft--) {
    const atSecond = targetSeconds - secondsLeft;
    const clashesWithHalfway =
      atSecond === HALFWAY_CUE_SECOND && targetSeconds > HALFWAY_CUE_SECOND;
    if (atSecond > 0 && !clashesWithHalfway) {
      plan.push({ atSecond, cue: 'tick' });
    }
  }
  plan.push({ atSecond: targetSeconds, cue: 'target' });

  return plan.sort((a, b) => a.atSecond - b.atSecond);
}

/**
 * The cues that fall after `previousSeconds` and up to `currentSeconds`.
 * The timer calls this on every update, so each cue plays exactly once.
 * When the app was asleep and jumps far ahead, only the latest cue plays, so a
 * pile of old beeps never plays at once (spec: missed cues are skipped).
 */
export function cuesBetween(
  previousSeconds: number,
  currentSeconds: number,
  targetSeconds: number,
): TimerCue[] {
  const due = cuePlanFor(targetSeconds).filter(
    (scheduled) => scheduled.atSecond > previousSeconds && scheduled.atSecond <= currentSeconds,
  );
  return due.length > 1 ? [due[due.length - 1].cue] : due.map((scheduled) => scheduled.cue);
}

/**
 * Beeps of the get-ready countdown: 'count' at 3, 2 and 1 seconds left, then 'go'.
 * `secondsLeft` values are whole seconds remaining before the timer starts.
 */
export type CountdownCue = 'count' | 'go';

export function countdownCueFor(secondsLeft: number): CountdownCue | null {
  if (secondsLeft === 0) {
    return 'go';
  }
  return secondsLeft >= 1 && secondsLeft <= COUNTDOWN_SECONDS ? 'count' : null;
}
