import {
  Attempt,
  Challenge,
  CheckIn,
  CheckOffChallenge,
  dateOfDay,
  formatDuration,
  isCheckOffChallenge,
  isTimedChallenge,
  TimedChallenge,
} from '../../domain';
import { AttemptRepository, ChallengeRepository, CheckInRepository } from '../ports';

const CSV_HEADER = [
  'challenge',
  'category',
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

/** One CSV row with the challenge it belongs to, so rows can be sorted before writing. */
interface Row {
  readonly challenge: Challenge;
  readonly dayNumber: number;
  readonly recordedOn: string;
  readonly values: readonly string[];
}

/**
 * Builds the CSV backup: one row per wall squat attempt and one per check-in
 * (BR-15: notes included), oldest challenge and day first.
 * The UI then hands the text to the iOS share sheet.
 */
export class ExportHistoryCsvUseCase {
  constructor(
    private readonly challenges: ChallengeRepository,
    private readonly attempts: AttemptRepository,
    private readonly checkIns: CheckInRepository,
  ) {}

  async execute(): Promise<string> {
    const challenges = await this.challenges.findAll();
    const timed = new Map(challenges.filter(isTimedChallenge).map((c) => [c.id, c]));
    const checkOff = new Map(challenges.filter(isCheckOffChallenge).map((c) => [c.id, c]));

    const attemptRows = (await this.attempts.findAll()).flatMap((attempt) => {
      const challenge = timed.get(attempt.challengeId);
      return challenge ? [attemptRow(attempt, challenge)] : [];
    });
    const checkInRows = (await this.checkIns.findAll()).flatMap((checkIn) => {
      const challenge = checkOff.get(checkIn.challengeId);
      return challenge ? [checkInRow(checkIn, challenge)] : [];
    });

    const rows = [...attemptRows, ...checkInRows].sort(byChallengeThenDay).map((row) => row.values);
    return [CSV_HEADER, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n');
  }
}

function attemptRow(attempt: Attempt, challenge: TimedChallenge): Row {
  return {
    challenge,
    dayNumber: attempt.dayNumber,
    recordedOn: attempt.recordedOn,
    values: [
      challenge.name,
      challenge.category,
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
    ],
  };
}

/** A check-in has no time or feeling, so those columns stay empty. */
function checkInRow(checkIn: CheckIn, challenge: CheckOffChallenge): Row {
  return {
    challenge,
    dayNumber: checkIn.dayNumber,
    recordedOn: checkIn.recordedOn,
    values: [
      challenge.name,
      challenge.category,
      challenge.startDate,
      '',
      String(checkIn.dayNumber),
      dateOfDay(challenge, checkIn.dayNumber),
      checkIn.recordedOn,
      '',
      '',
      'check-in',
      checkIn.isMakeUp ? 'yes' : 'no',
      '',
      checkIn.note,
    ],
  };
}

function byChallengeThenDay(a: Row, b: Row): number {
  return (
    a.challenge.startDate.localeCompare(b.challenge.startDate) ||
    a.challenge.name.localeCompare(b.challenge.name) ||
    a.dayNumber - b.dayNumber ||
    a.recordedOn.localeCompare(b.recordedOn)
  );
}

/** Wraps a value in quotes when it holds a comma, quote or line break (RFC 4180). */
function escapeCsvValue(value: string): string {
  const needsQuotes = /[",\n\r]/.test(value);
  return needsQuotes ? `"${value.replaceAll('"', '""')}"` : value;
}
