import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { COUNTDOWN_SECONDS, countdownCueFor, cuesBetween } from '../../domain';
import { SOUND_PLAYER } from '../../composition/provide-wall-squat';

/**
 * - countdown: the 3, 2, 1 get-ready beeps
 * - running: the hold is being timed
 * - stopped: the user pressed Stop
 */
export type HoldTimerPhase = 'idle' | 'countdown' | 'running' | 'stopped';

/** How often the screen updates. Faster than once a second so no second is skipped. */
const UPDATE_EVERY_MS = 200;
const MS_PER_SECOND = 1000;

/**
 * Times one wall squat hold and plays its cues (spec section 4).
 *
 * The time is always worked out from the moment the phase started (Date.now),
 * never by counting updates. So when iOS pauses the page, for example when the
 * screen locks, the time is still right when the app comes back.
 *
 * Provide it on the Timer screen, so every visit gets a fresh timer.
 */
@Injectable()
export class HoldTimer implements OnDestroy {
  private readonly sound = inject(SOUND_PLAYER);

  private readonly phaseState = signal<HoldTimerPhase>('idle');
  private readonly countdownState = signal(COUNTDOWN_SECONDS);
  private readonly elapsedState = signal(0);

  readonly phase = this.phaseState.asReadonly();
  readonly countdownSecondsLeft = this.countdownState.asReadonly();
  readonly elapsedSeconds = this.elapsedState.asReadonly();

  private targetSeconds = 0;
  private phaseStartedAt = 0;
  private updateTimerId: ReturnType<typeof setInterval> | undefined;

  /** Starts the get-ready countdown; the hold is timed from "go". */
  start(targetSeconds: number): void {
    this.targetSeconds = targetSeconds;
    this.phaseStartedAt = Date.now();
    this.countdownState.set(COUNTDOWN_SECONDS);
    this.elapsedState.set(0);
    this.phaseState.set('countdown');
    this.playCountdownCue(COUNTDOWN_SECONDS);
    this.updateTimerId = setInterval(() => this.update(), UPDATE_EVERY_MS);
  }

  /** Stops the timer and returns the hold in whole seconds (0 when stopped during the countdown). */
  stop(): number {
    this.update();
    this.stopUpdating();
    this.phaseState.set('stopped');
    return this.elapsedState();
  }

  ngOnDestroy(): void {
    this.stopUpdating();
  }

  private update(): void {
    const secondsInPhase = Math.floor((Date.now() - this.phaseStartedAt) / MS_PER_SECOND);
    if (this.phaseState() === 'countdown') {
      this.updateCountdown(secondsInPhase);
    }
    if (this.phaseState() === 'running') {
      this.updateHold();
    }
  }

  private updateCountdown(secondsInPhase: number): void {
    const secondsLeft = Math.max(0, COUNTDOWN_SECONDS - secondsInPhase);
    if (secondsLeft === this.countdownState()) {
      return;
    }
    this.countdownState.set(secondsLeft);
    this.playCountdownCue(secondsLeft);

    if (secondsLeft === 0) {
      // "Go": the hold starts exactly when the countdown ended, even if this update came late.
      this.phaseStartedAt += COUNTDOWN_SECONDS * MS_PER_SECOND;
      this.phaseState.set('running');
    }
  }

  private updateHold(): void {
    const previous = this.elapsedState();
    const current = Math.max(0, Math.floor((Date.now() - this.phaseStartedAt) / MS_PER_SECOND));
    if (current === previous) {
      return;
    }
    this.elapsedState.set(current);
    for (const cue of cuesBetween(previous, current, this.targetSeconds)) {
      this.sound.playTimerCue(cue);
    }
  }

  private playCountdownCue(secondsLeft: number): void {
    const cue = countdownCueFor(secondsLeft);
    if (cue !== null) {
      this.sound.playCountdown(cue);
    }
  }

  private stopUpdating(): void {
    clearInterval(this.updateTimerId);
    this.updateTimerId = undefined;
  }
}
