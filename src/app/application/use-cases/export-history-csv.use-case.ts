import { Attempt, dateOfDay, formatDuration, isTimedChallenge, TimedChallenge } from '../../domain';
import { AttemptRepository, ChallengeRepository } from '../ports';

const CSV_HEADER = [
  'challenge_start',
  'target',
  'day',
  'day_date',
  'recorded_on',
  'seconds',
  'time',
  'source',
  'make_up',
  'feeling',
  'note',
];

/**
 * Builds the CSV backup: one row per attempt, oldest challenge and day first.
 * The UI then hands the text to the iOS share sheet.
 */
export class ExportHistoryCsvUseCase {
  constructor(
    private readonly challenges: ChallengeRepository,
    private readonly attempts: AttemptRepository,
  ) {}

  async execute(): Promise<string> {
    const challenges = await this.challenges.findAll();
    const attempts = await this.attempts.findAll();
    const challengeById = new Map(
      challenges.filter(isTimedChallenge).map((challenge) => [challenge.id, challenge]),
    );

    const rows = attempts
      .flatMap((attempt) => {
        const challenge = challengeById.get(attempt.challengeId);
        return challenge ? [{ attempt, challenge }] : [];
      })
      .sort(byChallengeThenDay)
      .map(({ attempt, challenge }) => toRow(attempt, challenge));

    return [CSV_HEADER, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n');
  }
}

type AttemptWithChallenge = { attempt: Attempt; challenge: TimedChallenge };

function byChallengeThenDay(a: AttemptWithChallenge, b: AttemptWithChallenge): number {
  return (
    a.challenge.startDate.localeCompare(b.challenge.startDate) ||
    a.attempt.dayNumber - b.attempt.dayNumber ||
    a.attempt.recordedOn.localeCompare(b.attempt.recordedOn)
  );
}

function toRow(attempt: Attempt, challenge: TimedChallenge): string[] {
  return [
    challenge.startDate,
    formatDuration(challenge.targetSeconds),
    String(attempt.dayNumber),
    dateOfDay(challenge, attempt.dayNumber),
    attempt.recordedOn,
    String(attempt.durationSeconds),
    formatDuration(attempt.durationSeconds),
    attempt.source,
    attempt.isMakeUp ? 'yes' : 'no',
    attempt.feeling,
    attempt.note,
  ];
}

/** Wraps a value in quotes when it holds a comma, quote or line break (RFC 4180). */
function escapeCsvValue(value: string): string {
  const needsQuotes = /[",\n\r]/.test(value);
  return needsQuotes ? `"${value.replaceAll('"', '""')}"` : value;
}
