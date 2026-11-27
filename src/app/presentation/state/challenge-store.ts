import { computed, inject, Injectable, signal } from '@angular/core';
import {
  ChallengeOverview,
  DeleteAttemptUseCase,
  GetChallengeOverviewUseCase,
  MarkCelebrationShownUseCase,
  RecordAttemptInput,
  RecordAttemptResult,
  RecordAttemptUseCase,
  ResetHistoryUseCase,
  StartChallengeUseCase,
} from '../../application';
import { DayResult } from '../../domain';

/** Shown on Today right after an attempt was saved. */
export interface SavedNotice {
  readonly durationSeconds: number;
  readonly isPersonalBest: boolean;
}

/**
 * The screens' single source of truth for the current challenge.
 * Screens read its signals; every change goes through a use case and then reloads,
 * so what the screen shows always matches what is stored.
 */
@Injectable({ providedIn: 'root' })
export class ChallengeStore {
  private readonly getOverview = inject(GetChallengeOverviewUseCase);
  private readonly startChallenge = inject(StartChallengeUseCase);
  private readonly recordAttempt = inject(RecordAttemptUseCase);
  private readonly deleteAttemptUseCase = inject(DeleteAttemptUseCase);
  private readonly resetHistoryUseCase = inject(ResetHistoryUseCase);
  private readonly markCelebrationShownUseCase = inject(MarkCelebrationShownUseCase);

  private readonly overviewState = signal<ChallengeOverview | null>(null);
  private readonly savedNoticeState = signal<SavedNotice | null>(null);

  readonly overview = this.overviewState.asReadonly();
  readonly savedNotice = this.savedNoticeState.asReadonly();

  /** Today's day result, or null when the challenge has ended. */
  readonly today = computed<DayResult | null>(() => {
    const overview = this.overviewState();
    const dayNumber = overview?.todayDayNumber ?? null;
    return overview && dayNumber !== null ? overview.days[dayNumber - 1] : null;
  });

  async load(): Promise<ChallengeOverview | null> {
    const overview = await this.getOverview.execute();
    this.overviewState.set(overview);
    return overview;
  }

  async start(targetSeconds: number): Promise<void> {
    await this.startChallenge.execute(targetSeconds);
    this.savedNoticeState.set(null);
    await this.load();
  }

  async record(input: RecordAttemptInput): Promise<RecordAttemptResult> {
    const result = await this.recordAttempt.execute(input);
    if (result.status === 'saved') {
      this.savedNoticeState.set({
        durationSeconds: result.attempt.durationSeconds,
        isPersonalBest: result.isPersonalBest,
      });
      await this.load();
    }
    return result;
  }

  async deleteAttempt(attemptId: string): Promise<void> {
    await this.deleteAttemptUseCase.execute(attemptId);
    this.savedNoticeState.set(null);
    await this.load();
  }

  /** BR-11: deletes every challenge and attempt. */
  async resetHistory(): Promise<void> {
    await this.resetHistoryUseCase.execute();
    this.savedNoticeState.set(null);
    await this.load();
  }

  /** BR-10: the celebration is shown once; after this the finished challenge moves to history. */
  async markCelebrationShown(): Promise<void> {
    const challenge = this.overviewState()?.challenge;
    if (challenge) {
      await this.markCelebrationShownUseCase.execute(challenge.id);
      await this.load();
    }
  }

  dismissSavedNotice(): void {
    this.savedNoticeState.set(null);
  }
}
