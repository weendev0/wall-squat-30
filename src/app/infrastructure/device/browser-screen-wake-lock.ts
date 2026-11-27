import { ScreenWakeLock } from '../../application';

/**
 * Keeps the iPhone screen on with the Screen Wake Lock API (Safari 16.4+).
 * The browser drops the lock when the app goes to the background, so it is
 * requested again when the app comes back while the timer still runs.
 */
export class BrowserScreenWakeLock implements ScreenWakeLock {
  private sentinel: WakeLockSentinel | null = null;
  private isWanted = false;

  constructor(
    private readonly wakeLock: WakeLock | undefined = navigator.wakeLock,
    private readonly page: Document = document,
  ) {}

  async acquire(): Promise<void> {
    this.isWanted = true;
    this.page.addEventListener('visibilitychange', this.requestAgainWhenVisible);
    await this.request();
  }

  async release(): Promise<void> {
    this.isWanted = false;
    this.page.removeEventListener('visibilitychange', this.requestAgainWhenVisible);
    const sentinel = this.sentinel;
    this.sentinel = null;
    await sentinel?.release();
  }

  private readonly requestAgainWhenVisible = (): void => {
    if (this.isWanted && this.page.visibilityState === 'visible') {
      void this.request();
    }
  };

  private async request(): Promise<void> {
    if (this.wakeLock === undefined) {
      return; // older browser: the timer still works, the screen may just dim
    }
    try {
      const sentinel = await this.wakeLock.request('screen');
      if (this.isWanted) {
        this.sentinel = sentinel;
      } else {
        await sentinel.release(); // the timer ended while the request was on its way
      }
    } catch {
      // Refused, for example in Low Power Mode. The timer keeps working.
    }
  }
}
