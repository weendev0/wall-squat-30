import { DeleteAttemptUseCase } from '../use-cases/delete-attempt.use-case';
import { ExportHistoryCsvUseCase } from '../use-cases/export-history-csv.use-case';
import { GetChallengeOverviewUseCase } from '../use-cases/get-challenge-overview.use-case';
import { GetSessionHistoryUseCase } from '../use-cases/get-session-history.use-case';
import { MarkCelebrationShownUseCase } from '../use-cases/mark-celebration-shown.use-case';
import { RecordAttemptUseCase } from '../use-cases/record-attempt.use-case';
import { ResetHistoryUseCase } from '../use-cases/reset-history.use-case';
import { StartChallengeUseCase } from '../use-cases/start-challenge.use-case';
import {
  FakeClock,
  InMemoryAttemptRepository,
  InMemoryChallengeRepository,
  SequentialIdGenerator,
} from './fakes';

/** Wires every use case to in-memory fakes, starting on 16 Nov 2026 unless told otherwise. */
export function createTestApp(startDate = '2026-11-16') {
  const challenges = new InMemoryChallengeRepository();
  const attempts = new InMemoryAttemptRepository();
  const clock = new FakeClock(startDate);
  const ids = new SequentialIdGenerator();

  return {
    challenges,
    attempts,
    clock,
    startChallenge: new StartChallengeUseCase(challenges, clock, ids),
    getOverview: new GetChallengeOverviewUseCase(challenges, attempts, clock),
    getSessionHistory: new GetSessionHistoryUseCase(challenges, attempts, clock),
    recordAttempt: new RecordAttemptUseCase(challenges, attempts, clock, ids),
    deleteAttempt: new DeleteAttemptUseCase(attempts),
    markCelebrationShown: new MarkCelebrationShownUseCase(challenges),
    resetHistory: new ResetHistoryUseCase(challenges, attempts),
    exportCsv: new ExportHistoryCsvUseCase(challenges, attempts),
  };
}
