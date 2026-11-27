import { WebAudioSoundPlayer } from './web-audio-sound-player';

interface PlayedNote {
  wave: string;
  frequencyHz: number;
  startsAt: number;
  endsAt: number;
}

/** Records what the player asks Web Audio to do, without making any sound. */
class FakeAudioContext {
  state: AudioContextState = 'suspended';
  currentTime = 10;
  readonly sampleRate = 44100;
  readonly destination = {};
  readonly notes: PlayedNote[] = [];
  silentSoundsPlayed = 0;
  resumeCalls = 0;

  async resume(): Promise<void> {
    this.resumeCalls++;
    this.state = 'running';
  }

  createBuffer() {
    return {};
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: () => undefined,
      start: () => {
        this.silentSoundsPlayed++;
      },
    };
  }

  createGain() {
    const gain = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
    return { gain, connect: (target: unknown) => target };
  }

  createOscillator() {
    const played: PlayedNote = { wave: '', frequencyHz: 0, startsAt: 0, endsAt: 0 };
    return {
      set type(wave: string) {
        played.wave = wave;
      },
      frequency: {
        set value(hz: number) {
          played.frequencyHz = hz;
        },
      },
      connect: (target: unknown) => target,
      start: (at: number) => {
        played.startsAt = at;
        this.notes.push(played);
      },
      stop: (at: number) => {
        played.endsAt = at;
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

    expect(context.notes).toEqual([]);
  });

  it('opens the audio inside the tap and asks to play even on silent mode', async () => {
    await player.unlock();

    expect(context.silentSoundsPlayed).toBe(1);
    expect(context.state).toBe('running');
    expect(browser.audioSession?.type).toBe('playback');
  });

  it('plays a long, high beep when the target is reached', async () => {
    await player.unlock();

    player.playTimerCue('target');

    expect(context.notes).toEqual([
      { wave: 'sine', frequencyHz: 1320, startsAt: 10, endsAt: 10.8 },
    ]);
  });

  it('gives the countdown its own brighter sound and a rising two-note go', async () => {
    await player.unlock();

    player.playCountdown('count');
    player.playCountdown('go');

    expect(context.notes.map((n) => [n.wave, n.frequencyHz, n.startsAt])).toEqual([
      ['triangle', 784, 10],
      ['triangle', 784, 10],
      ['triangle', 1175, 10.12],
    ]);
  });

  it('keeps the first countdown beep when audio is still waking up', async () => {
    const unlocking = player.unlock(); // the tap
    context.state = 'suspended'; // iOS has not finished resuming yet

    player.playCountdown('count');
    await unlocking;
    await Promise.resolve();

    expect(context.notes).toHaveLength(1);
  });

  it('resumes audio that iOS paused, then plays', async () => {
    await player.unlock();
    context.state = 'interrupted' as AudioContextState;

    player.playTimerCue('tick');
    await Promise.resolve();

    expect(context.state).toBe('running');
    expect(context.notes).toHaveLength(1);
  });

  it('works in browsers without an audio session', async () => {
    const plainPlayer = new WebAudioSoundPlayer(() => context as unknown as AudioContext, {});

    await plainPlayer.unlock();
    plainPlayer.playTimerCue('halfway');

    expect(context.notes).toHaveLength(1);
  });
});
