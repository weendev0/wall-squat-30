import {
  EnvironmentProviders,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import {
  AttemptRepository,
  ChallengeRepository,
  Clock,
  DeleteAttemptUseCase,
  ExportHistoryCsvUseCase,
  GetChallengeOverviewUseCase,
  IdGenerator,
  MarkCelebrationShownUseCase,
  RecordAttemptUseCase,
  ResetHistoryUseCase,
  ScreenWakeLock,
  SoundPlayer,
  StartChallengeUseCase,
} from '../application';
import { BrowserScreenWakeLock } from '../infrastructure/device/browser-screen-wake-lock';
import { RandomIdGenerator } from '../infrastructure/device/random-id-generator';
import { SystemClock } from '../infrastructure/device/system-clock';
import { WebAudioSoundPlayer } from '../infrastructure/device/web-audio-sound-player';
import { DexieAttemptRepository } from '../infrastructure/persistence/dexie-attempt-repository';
import { DexieChallengeRepository } from '../infrastructure/persistence/dexie-challenge-repository';
import { WallSquatDatabase } from '../infrastructure/persistence/wall-squat-database';

/**
 * The composition root: the one place that decides which real class fills each port.
 * Screens ask Angular for a use case, for example `inject(RecordAttemptUseCase)`,
 * and never see IndexedDB or the system clock.
 */

export const WALL_SQUAT_DATABASE = new InjectionToken<WallSquatDatabase>('WallSquatDatabase');
export const CHALLENGE_REPOSITORY = new InjectionToken<ChallengeRepository>('ChallengeRepository');
export const ATTEMPT_REPOSITORY = new InjectionToken<AttemptRepository>('AttemptRepository');
export const CLOCK = new InjectionToken<Clock>('Clock');
export const ID_GENERATOR = new InjectionToken<IdGenerator>('IdGenerator');
export const SOUND_PLAYER = new InjectionToken<SoundPlayer>('SoundPlayer');
export const SCREEN_WAKE_LOCK = new InjectionToken<ScreenWakeLock>('ScreenWakeLock');

export function provideWallSquat(): EnvironmentProviders {
  return makeEnvironmentProviders([
    // Ports filled with real infrastructure
    { provide: WALL_SQUAT_DATABASE, useFactory: () => new WallSquatDatabase() },
    {
      provide: CHALLENGE_REPOSITORY,
      useFactory: () => new DexieChallengeRepository(inject(WALL_SQUAT_DATABASE)),
    },
    {
      provide: ATTEMPT_REPOSITORY,
      useFactory: () => new DexieAttemptRepository(inject(WALL_SQUAT_DATABASE)),
    },
    { provide: CLOCK, useFactory: () => new SystemClock() },
    { provide: ID_GENERATOR, useFactory: () => new RandomIdGenerator() },
    { provide: SOUND_PLAYER, useFactory: () => new WebAudioSoundPlayer() },
    { provide: SCREEN_WAKE_LOCK, useFactory: () => new BrowserScreenWakeLock() },

    // Use cases
    {
      provide: StartChallengeUseCase,
      useFactory: () =>
        new StartChallengeUseCase(
          inject(CHALLENGE_REPOSITORY),
          inject(CLOCK),
          inject(ID_GENERATOR),
        ),
    },
    {
      provide: GetChallengeOverviewUseCase,
      useFactory: () =>
        new GetChallengeOverviewUseCase(
          inject(CHALLENGE_REPOSITORY),
          inject(ATTEMPT_REPOSITORY),
          inject(CLOCK),
        ),
    },
    {
      provide: RecordAttemptUseCase,
      useFactory: () =>
        new RecordAttemptUseCase(
          inject(CHALLENGE_REPOSITORY),
          inject(ATTEMPT_REPOSITORY),
          inject(CLOCK),
          inject(ID_GENERATOR),
        ),
    },
    {
      provide: DeleteAttemptUseCase,
      useFactory: () => new DeleteAttemptUseCase(inject(ATTEMPT_REPOSITORY)),
    },
    {
      provide: MarkCelebrationShownUseCase,
      useFactory: () => new MarkCelebrationShownUseCase(inject(CHALLENGE_REPOSITORY)),
    },
    {
      provide: ResetHistoryUseCase,
      useFactory: () =>
        new ResetHistoryUseCase(inject(CHALLENGE_REPOSITORY), inject(ATTEMPT_REPOSITORY)),
    },
    {
      provide: ExportHistoryCsvUseCase,
      useFactory: () =>
        new ExportHistoryCsvUseCase(inject(CHALLENGE_REPOSITORY), inject(ATTEMPT_REPOSITORY)),
    },

    // Ask Safari to keep our data even when the phone runs low on space (spec section 5).
    provideAppInitializer(() => {
      void requestPersistentStorage();
    }),
  ]);
}

async function requestPersistentStorage(): Promise<void> {
  try {
    await navigator.storage?.persist?.();
  } catch {
    // Not supported in this browser: the data is still stored, just without the extra guarantee.
  }
}
