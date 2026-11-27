import { computed, inject, Injectable, signal } from '@angular/core';
import {
  CheckInInput,
  CheckInUseCase,
  CheckOffOverview,
  GetCheckOffOverviewsUseCase,
  MarkCelebrationShownUseCase,
  StartCheckOffChallengeInput,
  StartCheckOffChallengeUseCase,
  UndoCheckInUseCase,
} from '../../application';
import { CheckOffChallenge } from '../../domain';

/**
 * The screens' single source of truth for Reading, Course and Study challenges.
 * Works like ChallengeStore: every change goes through a use case, then reloads.
 */
@Injectable({ providedIn: 'root' })
export class CheckOffStore {
  private readonly getOverviews = inject(GetCheckOffOverviewsUseCase);
  private readonly startUseCase = inject(StartCheckOffChallengeUseCase);
  private readonly checkInUseCase = inject(CheckInUseCase);
  private readonly undoUseCase = inject(UndoCheckInUseCase);
  private readonly markCelebrationShownUseCase = inject(MarkCelebrationShownUseCase);

  private readonly overviewsState = signal<readonly CheckOffOverview[]>([]);

  /** Every check-off challenge: running ones first, then finished ones. */
  readonly overviews = this.overviewsState.asReadonly();

  /** BR-13: the challenges still running, shown on Today. */
  readonly active = computed(() =>
    this.overviewsState().filter((overview) => overview.challenge.status === 'active'),
  );

  /** BR-18: a just-finished challenge whose celebration has not been shown yet. */
  readonly awaitingCelebration = computed(
    () => this.overviewsState().find((overview) => overview.needsCelebration) ?? null,
  );

  async load(): Promise<readonly CheckOffOverview[]> {
    const overviews = await this.getOverviews.execute();
    this.overviewsState.set(overviews);
    return overviews;
  }

  find(challengeId: string): CheckOffOverview | null {
    return this.overviewsState().find((overview) => overview.challenge.id === challengeId) ?? null;
  }

  async start(input: StartCheckOffChallengeInput): Promise<CheckOffChallenge> {
    const challenge = await this.startUseCase.execute(input);
    await this.load();
    return challenge;
  }

  async checkIn(input: CheckInInput): Promise<void> {
    await this.checkInUseCase.execute(input);
    await this.load();
  }

  async undoCheckIn(challengeId: string, dayNumber: number): Promise<void> {
    await this.undoUseCase.execute(challengeId, dayNumber);
    await this.load();
  }

  async markCelebrationShown(challengeId: string): Promise<void> {
    await this.markCelebrationShownUseCase.execute(challengeId);
    await this.load();
  }
}
