import { computed, inject, Injectable, signal } from '@angular/core';
import {
  DeleteAttemptUseCase,
  GetTimedOverviewsUseCase,
  MarkCelebrationShownUseCase,
  RecordAttemptInput,
  RecordAttemptResult,
  RecordAttemptUseCase,
  ResetHistoryUseCase,
  StartChallengeUseCase,
  TimedOverview,
} from '../../application';
import { DayResult, TimedChallenge } from '../../domain';

/** Shown on Today right after an attempt was saved. */
export interface SavedNotice {
  readonly challengeId: string;
  readonly durationSeconds: number;
  readonly isPersonalBest: boolean;
}

/** Today's day result of a timed challenge, or null when the challenge has ended. */
export function todayResult(overview: TimedOverview): DayResult | null {
  const dayNumber = overview.todayDayNumber;
  return dayNumber === null ? null : overview.days[dayNumber - 1];
}

/**
 * The screens' single source of truth for timed challenges, such as Wall Squat and Plank.
 * Several can run at once, one per category (BR-16).
 * Screens read its signals; every change goes through a use case and then reloads,
 * so what the screen shows always matches what is stored.
 */
@Injectable({ providedIn: 'root' })
export class ChallengeStore {
  private readonly getOverviews = inject(GetTimedOverviewsUseCase);
  private readonly startChallenge = inject(StartChallengeUseCase);
  private readonly recordAttempt = inject(RecordAttemptUseCase);
  private readonly deleteAttemptUseCase = inject(DeleteAttemptUseCase);
  private readonly resetHistoryUseCase = inject(ResetHistoryUseCase);
  private readonly markCelebrationShownUseCase = inject(MarkCelebrationShownUseCase);

  private readonly overviewsState = signal<readonly TimedOverview[]>([]);
  private readonly savedNoticeState = signal<SavedNotice | null>(null);

  /** Running timed challenges first, then finished ones still owing their celebration. */
  readonly overviews = this.overviewsState.asReadonly();
  readonly savedNotice = this.savedNoticeState.asReadonly();

  /** BR-16: the timed challenges still running, shown on Today. */
  readonly active = computed(() =>
    this.overviewsState().filter((overview) => overview.challenge.status === 'active'),
  );

  /** BR-10: a just-finished challenge whose celebration has not been shown yet. */
  readonly awaitingCelebration = computed(
    () => this.overviewsState().find((overview) => overview.needsCelebration) ?? null,
  );

  async load(): Promise<readonly TimedOverview[]> {
    const overviews = await this.getOverviews.execute();
    this.overviewsState.set(overviews);
    return overviews;
  }

  find(challengeId: string): TimedOverview | null {
    return this.overviewsState().find((overview) => overview.challenge.id === challengeId) ?? null;
  }

  /** BR-15, BR-16: starts a timed challenge in the chosen category. */
  async start(targetSeconds: number, category: string): Promise<TimedChallenge> {
    const challenge = await this.startChallenge.execute(targetSeconds, category);
    this.savedNoticeState.set(null);
    await this.load();
    return challenge;
  }

  async record(input: RecordAttemptInput): Promise<RecordAttemptResult> {
    const result = await this.recordAttempt.execute(input);
    if (result.status === 'saved') {
      this.savedNoticeState.set({
        challengeId: input.challengeId,
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

  /** BR-11: deletes every challenge, attempt and saved category. */
  async resetHistory(): Promise<void> {
    await this.resetHistoryUseCase.execute();
    this.savedNoticeState.set(null);
    await this.load();
  }

  /** BR-10: the celebration is shown once; after this the finished challenge moves to history. */
  async markCelebrationShown(challengeId: string): Promise<void> {
    await this.markCelebrationShownUseCase.execute(challengeId);
    await this.load();
  }

  dismissSavedNotice(): void {
    this.savedNoticeState.set(null);
  }
}
