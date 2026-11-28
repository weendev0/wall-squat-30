import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DeleteAttemptUseCase,
  ExportHistoryCsvUseCase,
  GetSessionHistoryUseCase,
  GetTimedOverviewsUseCase,
  MarkCelebrationShownUseCase,
  RecordAttemptUseCase,
  ResetHistoryUseCase,
  StartChallengeUseCase,
} from '../application';
import { BrowserFileSharer } from '../infrastructure/device/browser-file-sharer';
import { BrowserScreenWakeLock } from '../infrastructure/device/browser-screen-wake-lock';
import { WebAudioSoundPlayer } from '../infrastructure/device/web-audio-sound-player';
import {
  FILE_SHARER,
  provideWallSquat,
  SCREEN_WAKE_LOCK,
  SOUND_PLAYER,
  WALL_SQUAT_DATABASE,
} from './provide-wall-squat';

describe('provideWallSquat', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideWallSquat()] });
  });

  afterEach(async () => {
    await TestBed.inject(WALL_SQUAT_DATABASE).delete();
  });

  const useCases: Type<unknown>[] = [
    StartChallengeUseCase,
    GetTimedOverviewsUseCase,
    GetSessionHistoryUseCase,
    RecordAttemptUseCase,
    DeleteAttemptUseCase,
    MarkCelebrationShownUseCase,
    ResetHistoryUseCase,
    ExportHistoryCsvUseCase,
  ];

  it.each(useCases)('provides %o', (useCase) => {
    expect(TestBed.inject(useCase)).toBeInstanceOf(useCase);
  });

  it('provides the sound and screen-awake services of the browser', () => {
    expect(TestBed.inject(SOUND_PLAYER)).toBeInstanceOf(WebAudioSoundPlayer);
    expect(TestBed.inject(SCREEN_WAKE_LOCK)).toBeInstanceOf(BrowserScreenWakeLock);
    expect(TestBed.inject(FILE_SHARER)).toBeInstanceOf(BrowserFileSharer);
  });

  it('wires the use cases to real storage end to end', async () => {
    const challenge = await TestBed.inject(StartChallengeUseCase).execute();
    await TestBed.inject(RecordAttemptUseCase).execute({
      challengeId: challenge.id,
      durationSeconds: 61,
      source: 'timer',
    });

    const [overview] = await TestBed.inject(GetTimedOverviewsUseCase).execute();

    expect(overview.todayDayNumber).toBe(1);
    expect(overview.days[0].status).toBe('complete');
  });
});
