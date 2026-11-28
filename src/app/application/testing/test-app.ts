import { AddTimedCategoryUseCase } from '../use-cases/add-timed-category.use-case';
import { CheckInUseCase } from '../use-cases/check-in.use-case';
import { DeleteAttemptUseCase } from '../use-cases/delete-attempt.use-case';
import { ExportHistoryCsvUseCase } from '../use-cases/export-history-csv.use-case';
import { GetCheckOffOverviewsUseCase } from '../use-cases/get-check-off-overviews.use-case';
import { GetSessionHistoryUseCase } from '../use-cases/get-session-history.use-case';
import { GetTimedCategoriesUseCase } from '../use-cases/get-timed-categories.use-case';
import { GetTimedOverviewsUseCase } from '../use-cases/get-timed-overviews.use-case';
import { MarkCelebrationShownUseCase } from '../use-cases/mark-celebration-shown.use-case';
import { RecordAttemptUseCase } from '../use-cases/record-attempt.use-case';
import { ResetHistoryUseCase } from '../use-cases/reset-history.use-case';
import { StartChallengeUseCase } from '../use-cases/start-challenge.use-case';
import { StartCheckOffChallengeUseCase } from '../use-cases/start-check-off-challenge.use-case';
import { UndoCheckInUseCase } from '../use-cases/undo-check-in.use-case';
import {
  FakeClock,
  InMemoryAttemptRepository,
  InMemoryChallengeRepository,
  InMemoryCheckInRepository,
  InMemoryTimedCategoryRepository,
  SequentialIdGenerator,
} from './fakes';

/** Wires every use case to in-memory fakes, starting on 16 Nov 2026 unless told otherwise. */
export function createTestApp(startDate = '2026-11-16') {
  const challenges = new InMemoryChallengeRepository();
  const attempts = new InMemoryAttemptRepository();
  const checkIns = new InMemoryCheckInRepository();
  const categories = new InMemoryTimedCategoryRepository();
  const clock = new FakeClock(startDate);
  const ids = new SequentialIdGenerator();

  return {
    challenges,
    attempts,
    checkIns,
    categories,
    clock,
    startChallenge: new StartChallengeUseCase(challenges, clock, ids),
    startCheckOffChallenge: new StartCheckOffChallengeUseCase(challenges, clock, ids),
    checkIn: new CheckInUseCase(challenges, checkIns, clock, ids),
    undoCheckIn: new UndoCheckInUseCase(challenges, checkIns),
    getTimedOverviews: new GetTimedOverviewsUseCase(challenges, attempts, clock),
    getTimedCategories: new GetTimedCategoriesUseCase(categories),
    addTimedCategory: new AddTimedCategoryUseCase(categories, ids),
    getCheckOffOverviews: new GetCheckOffOverviewsUseCase(challenges, checkIns, clock),
    getSessionHistory: new GetSessionHistoryUseCase(challenges, attempts, clock),
    recordAttempt: new RecordAttemptUseCase(challenges, attempts, clock, ids),
    deleteAttempt: new DeleteAttemptUseCase(attempts),
    markCelebrationShown: new MarkCelebrationShownUseCase(challenges),
    resetHistory: new ResetHistoryUseCase(challenges, attempts, checkIns, categories),
    exportCsv: new ExportHistoryCsvUseCase(challenges, attempts, checkIns),
  };
}
