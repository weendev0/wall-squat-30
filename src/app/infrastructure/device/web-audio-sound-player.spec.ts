import { WebAudioSoundPlayer } from './web-audio-sound-player';

/** Records what the player asks Web Audio to do, without making any sound. */
class FakeAudioContext {
  state: AudioContextState = 'suspended';
  currentTime = 10;
  readonly destination = {};
  readonly startedTones: { frequencyHz: number; startsAt: number; endsAt: number }[] = [];

  async resume(): Promise<void> {
    this.state = 'running';
  }

  createGain() {
    const gain = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
    return { gain, connect: (target: unknown) => target };
  }

  createOscillator() {
    const tone = { frequencyHz: 0, startsAt: 0, endsAt: 0 };
    return {
      type: '',
      frequency: {
        set value(hz: number) {
          tone.frequencyHz = hz;
        },
      },
      connect: (target: unknown) => target,
      start: (at: number) => {
        tone.startsAt = at;
        this.startedTones.push(tone);
      },
      stop: (at: number) => {
        tone.endsAt = at;
      },
    };
  }
}

describe('WebAudioSoundPlayer', () => {
  let context: FakeAudioContext;
  let browser: { audioSession?: { type: string } };
  let player: WebAudioSoundPlayer;

  beforeEach(() => {
    context = new FakeAudioContext();
    browser = { audioSession: { type: 'auto' } };
    player = new WebAudioSoundPlayer(() => context as unknown as AudioContext, browser);
  });

  it('stays silent until it is unlocked by a tap', () => {
    player.playTimerCue('target');

    expect(context.startedTones).toEqual([]);
  });

  it('wakes the audio up and asks to play even on silent mode', async () => {
    await player.unlock();

    expect(context.state).toBe('running');
    expect(browser.audioSession?.type).toBe('playback');
  });

  it('plays a long, high beep when the target is reached', async () => {
    await player.unlock();

    player.playTimerCue('target');

    expect(context.startedTones).toEqual([{ frequencyHz: 1320, startsAt: 10, endsAt: 10.8 }]);
  });

  it('plays a different beep for the countdown and for go', async () => {
    await player.unlock();

    player.playCountdown('count');
    player.playCountdown('go');

    expect(context.startedTones.map((tone) => tone.frequencyHz)).toEqual([660, 990]);
  });

  it('works in browsers without an audio session', async () => {
    const plainPlayer = new WebAudioSoundPlayer(() => context as unknown as AudioContext, {});

    await plainPlayer.unlock();
    plainPlayer.playTimerCue('halfway');

    expect(context.startedTones).toHaveLength(1);
  });

  it('resumes audio that iOS paused, then plays', async () => {
    await player.unlock();
    context.state = 'interrupted' as AudioContextState;

    player.playTimerCue('tick');

    expect(context.state).toBe('running');
    expect(context.startedTones).toHaveLength(1);
  });
});
