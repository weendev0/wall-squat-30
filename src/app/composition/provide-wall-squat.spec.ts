import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DeleteAttemptUseCase,
  ExportHistoryCsvUseCase,
  GetChallengeOverviewUseCase,
  MarkCelebrationShownUseCase,
  RecordAttemptUseCase,
  ResetHistoryUseCase,
  StartChallengeUseCase,
} from '../application';
import { provideWallSquat, WALL_SQUAT_DATABASE } from './provide-wall-squat';

describe('provideWallSquat', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideWallSquat()] });
  });

  afterEach(async () => {
    await TestBed.inject(WALL_SQUAT_DATABASE).delete();
  });

  const useCases: Type<unknown>[] = [
    StartChallengeUseCase,
    GetChallengeOverviewUseCase,
    RecordAttemptUseCase,
    DeleteAttemptUseCase,
    MarkCelebrationShownUseCase,
    ResetHistoryUseCase,
    ExportHistoryCsvUseCase,
  ];

  it.each(useCases)('provides %o', (useCase) => {
    expect(TestBed.inject(useCase)).toBeInstanceOf(useCase);
  });

  it('wires the use cases to real storage end to end', async () => {
    await TestBed.inject(StartChallengeUseCase).execute();
    await TestBed.inject(RecordAttemptUseCase).execute({ durationSeconds: 61, source: 'timer' });

    const overview = await TestBed.inject(GetChallengeOverviewUseCase).execute();

    expect(overview?.todayDayNumber).toBe(1);
    expect(overview?.days[0].status).toBe('complete');
  });
});
