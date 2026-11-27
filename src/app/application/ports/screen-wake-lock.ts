/** Keeps the screen on while the timer runs, so the phone does not lock mid-hold. */
export interface ScreenWakeLock {
  acquire(): Promise<void>;
  release(): Promise<void>;
}
