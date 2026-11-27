import { BrowserScreenWakeLock } from './browser-screen-wake-lock';

class FakeSentinel {
  released = false;

  async release(): Promise<void> {
    this.released = true;
  }
}

class FakeWakeLock {
  readonly sentinels: FakeSentinel[] = [];
  refuse = false;

  async request(): Promise<FakeSentinel> {
    if (this.refuse) {
      throw new Error('NotAllowedError');
    }
    const sentinel = new FakeSentinel();
    this.sentinels.push(sentinel);
    return sentinel;
  }
}

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('BrowserScreenWakeLock', () => {
  let wakeLock: FakeWakeLock;
  let screenLock: BrowserScreenWakeLock;

  beforeEach(() => {
    wakeLock = new FakeWakeLock();
    screenLock = new BrowserScreenWakeLock(wakeLock as unknown as WakeLock, document);
  });

  afterEach(() => setVisibility('visible'));

  it('keeps the screen on until it is released', async () => {
    await screenLock.acquire();
    expect(wakeLock.sentinels).toHaveLength(1);

    await screenLock.release();
    expect(wakeLock.sentinels[0].released).toBe(true);
  });

  it('asks again when the app comes back while the timer runs', async () => {
    await screenLock.acquire();

    setVisibility('hidden');
    setVisibility('visible');
    await Promise.resolve();

    expect(wakeLock.sentinels).toHaveLength(2);
  });

  it('does not ask again once the timer has ended', async () => {
    await screenLock.acquire();
    await screenLock.release();

    setVisibility('visible');
    await Promise.resolve();

    expect(wakeLock.sentinels).toHaveLength(1);
  });

  it('releases a lock that arrives after the timer has already ended', async () => {
    const pending = screenLock.acquire();
    await screenLock.release();
    await pending;

    expect(wakeLock.sentinels[0].released).toBe(true);
  });

  it('carries on quietly when the browser refuses or has no wake lock', async () => {
    wakeLock.refuse = true;
    await expect(screenLock.acquire()).resolves.toBeUndefined();

    const noSupport = new BrowserScreenWakeLock(undefined, document);
    await expect(noSupport.acquire()).resolves.toBeUndefined();
    await expect(noSupport.release()).resolves.toBeUndefined();
  });
});
