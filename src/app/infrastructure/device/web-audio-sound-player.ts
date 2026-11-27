import { SoundPlayer } from '../../application';
import { CountdownCue, TimerCue } from '../../domain';

/** One beep: its pitch and how long it lasts. */
interface Tone {
  readonly frequencyHz: number;
  readonly durationSeconds: number;
}

/** The sound of every cue. Higher and longer means "more important". */
const TONES: Record<CountdownCue | TimerCue, Tone> = {
  count: { frequencyHz: 660, durationSeconds: 0.15 },
  go: { frequencyHz: 990, durationSeconds: 0.4 },
  halfway: { frequencyHz: 880, durationSeconds: 0.2 },
  tick: { frequencyHz: 660, durationSeconds: 0.1 },
  target: { frequencyHz: 1320, durationSeconds: 0.8 },
};

const PEAK_VOLUME = 0.6;
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
    if (this.context.state !== 'running') {
      await this.context.resume();
    }
  }

  playCountdown(cue: CountdownCue): void {
    this.playTone(TONES[cue]);
  }

  playTimerCue(cue: TimerCue): void {
    this.playTone(TONES[cue]);
  }

  private playTone(tone: Tone): void {
    const context = this.context;
    if (context === null) {
      return; // never unlocked: stay silent rather than fail
    }
    if (context.state !== 'running') {
      void context.resume(); // iOS pauses audio after a phone call or a lock
    }

    const oscillator = context.createOscillator();
    const volume = context.createGain();
    const startsAt = context.currentTime;
    const endsAt = startsAt + tone.durationSeconds;

    oscillator.type = 'sine';
    oscillator.frequency.value = tone.frequencyHz;
    volume.gain.setValueAtTime(SILENT_VOLUME, startsAt);
    volume.gain.exponentialRampToValueAtTime(PEAK_VOLUME, startsAt + FADE_IN_SECONDS);
    volume.gain.exponentialRampToValueAtTime(SILENT_VOLUME, endsAt);

    oscillator.connect(volume).connect(context.destination);
    oscillator.start(startsAt);
    oscillator.stop(endsAt);
  }
}
