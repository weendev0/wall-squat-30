import { CountdownCue, TimerCue } from '../../domain';

/** Plays the timer's beeps and the check-in chime. The real one uses Web Audio; tests use a fake that records calls. */
export interface SoundPlayer {
  /** Must be called from a tap (iOS only allows sound after a user gesture). */
  unlock(): Promise<void>;
  playCountdown(cue: CountdownCue): void;
  playTimerCue(cue: TimerCue): void;
  /** BR-16: the short cheerful sound when a check-off day is marked Done. */
  playChime(): void;
}
