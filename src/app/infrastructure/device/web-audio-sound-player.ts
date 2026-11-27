import { SoundPlayer } from '../../application';
import { CountdownCue, TimerCue } from '../../domain';

/** One note of a sound: its pitch, when it starts within the sound, how long it lasts. */
interface Note {
  readonly frequencyHz: number;
  readonly startsAfterSeconds: number;
  readonly durationSeconds: number;
}

/** A cue's sound: one or more notes played with the same wave shape and volume. */
interface CueSound {
  /** 'triangle' is brighter than 'sine', so the countdown stands apart from the timer beeps. */
  readonly wave: OscillatorType;
  readonly volume: number;
  readonly notes: readonly Note[];
}

const note = (frequencyHz: number, startsAfterSeconds: number, durationSeconds: number): Note => ({
  frequencyHz,
  startsAfterSeconds,
  durationSeconds,
});

/**
 * The sound of every cue.
 * - The get-ready countdown has its own bright "blip" and a rising two-note "go".
 * - The timer cues are softer sine beeps; the target beep is the longest and highest.
 */
const SOUNDS: Record<CountdownCue | TimerCue, CueSound> = {
  count: { wave: 'triangle', volume: 0.9, notes: [note(784, 0, 0.18)] },
  go: { wave: 'triangle', volume: 0.9, notes: [note(784, 0, 0.12), note(1175, 0.12, 0.4)] },
  halfway: { wave: 'sine', volume: 0.7, notes: [note(880, 0, 0.25)] },
  tick: { wave: 'sine', volume: 0.7, notes: [note(660, 0, 0.1)] },
  target: { wave: 'sine', volume: 0.8, notes: [note(1320, 0, 0.8)] },
};

const SILENT_VOLUME = 0.0001; // exponential ramps cannot start or end at exactly 0
const FADE_IN_SECONDS = 0.01;

/** Safari 17+ lets a page ask to play sound even when the phone's silent switch is on. */
interface NavigatorWithAudioSession {
  readonly audioSession?: { type: string };
}

/**
 * Plays the timer's beeps with the Web Audio API, so no sound files are needed.
 * iOS only allows sound after a tap, so the Start button calls unlock() first.
 */
export class WebAudioSoundPlayer implements SoundPlayer {
  private context: AudioContext | null = null;

  constructor(
    private readonly createContext: () => AudioContext = () => new AudioContext(),
    private readonly browser: NavigatorWithAudioSession = navigator as NavigatorWithAudioSession,
  ) {}

  async unlock(): Promise<void> {
    if (this.browser.audioSession) {
      this.browser.audioSession.type = 'playback';
    }
    this.context ??= this.createContext();
    // iOS only opens the audio output when a sound starts inside the tap itself,
    // so play a tiny silent sound right now, before anything is awaited.
    this.playSilence(this.context);
    if (this.context.state !== 'running') {
      await this.context.resume();
    }
  }

  playCountdown(cue: CountdownCue): void {
    this.play(SOUNDS[cue]);
  }

  playTimerCue(cue: TimerCue): void {
    this.play(SOUNDS[cue]);
  }

  private play(sound: CueSound): void {
    const context = this.context;
    if (context === null) {
      return; // never unlocked: stay silent rather than fail
    }
    if (context.state === 'running') {
      this.schedule(context, sound);
      return;
    }
    // Audio is still waking up (right after the tap) or iOS paused it (after a call or a lock).
    // Wait for it, so the first countdown beep is not lost.
    void context.resume().then(() => this.schedule(context, sound));
  }

  private schedule(context: AudioContext, sound: CueSound): void {
    const now = context.currentTime;
    for (const { frequencyHz, startsAfterSeconds, durationSeconds } of sound.notes) {
      const startsAt = now + startsAfterSeconds;
      const endsAt = startsAt + durationSeconds;
      const oscillator = context.createOscillator();
      const volume = context.createGain();

      oscillator.type = sound.wave;
      oscillator.frequency.value = frequencyHz;
      volume.gain.setValueAtTime(SILENT_VOLUME, startsAt);
      volume.gain.exponentialRampToValueAtTime(sound.volume, startsAt + FADE_IN_SECONDS);
      volume.gain.exponentialRampToValueAtTime(SILENT_VOLUME, endsAt);

      oscillator.connect(volume).connect(context.destination);
      oscillator.start(startsAt);
      oscillator.stop(endsAt);
    }
  }

  private playSilence(context: AudioContext): void {
    const source = context.createBufferSource();
    source.buffer = context.createBuffer(1, 1, context.sampleRate);
    source.connect(context.destination);
    source.start(0);
  }
}
