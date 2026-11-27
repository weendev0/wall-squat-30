import { CountdownCue, TimerCue } from '../../domain';

/** Plays the timer's beeps. The real one uses Web Audio; tests use a fake that records calls. */
export interface SoundPlayer {
  /** Must be called from a tap (iOS only allows sound after a user gesture). */
  unlock(): Promise<void>;
  playCountdown(cue: CountdownCue): void;
  playTimerCue(cue: TimerCue): void;
}
