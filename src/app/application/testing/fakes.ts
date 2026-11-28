import {
  Attempt,
  Challenge,
  CheckIn,
  CountdownCue,
  CustomCheckOffCategory,
  LocalDate,
  TimedCategory,
  TimerCue,
} from '../../domain';
import {
  AttemptRepository,
  ChallengeRepository,
  CheckInRepository,
  CheckOffCategoryRepository,
  Clock,
  FileSharer,
  IdGenerator,
  ScreenWakeLock,
  ShareOutcome,
  SoundPlayer,
  TimedCategoryRepository,
} from '../ports';

/** In-memory stand-ins for the ports, so use cases can be tested without a browser. */

export class InMemoryChallengeRepository implements ChallengeRepository {
  readonly items = new Map<string, Challenge>();

  async findAllActive(): Promise<Challenge[]> {
    return [...this.items.values()].filter((challenge) => challenge.status === 'active');
  }

  async findById(id: string): Promise<Challenge | null> {
    return this.items.get(id) ?? null;
  }

  async findAll(): Promise<Challenge[]> {
    return [...this.items.values()].sort((a, b) => b.startDate.localeCompare(a.startDate));
  }

  async save(challenge: Challenge): Promise<void> {
    this.items.set(challenge.id, challenge);
  }

  async deleteAll(): Promise<void> {
    this.items.clear();
  }
}

export class InMemoryAttemptRepository implements AttemptRepository {
  readonly items = new Map<string, Attempt>();

  async findByChallenge(challengeId: string): Promise<Attempt[]> {
    return [...this.items.values()].filter((attempt) => attempt.challengeId === challengeId);
  }

  async findAll(): Promise<Attempt[]> {
    return [...this.items.values()];
  }

  async findById(id: string): Promise<Attempt | null> {
    return this.items.get(id) ?? null;
  }

  async save(attempt: Attempt): Promise<void> {
    this.items.set(attempt.id, attempt);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }

  async deleteAll(): Promise<void> {
    this.items.clear();
  }
}

export class InMemoryCheckInRepository implements CheckInRepository {
  readonly items = new Map<string, CheckIn>();

  async findByChallenge(challengeId: string): Promise<CheckIn[]> {
    return [...this.items.values()].filter((checkIn) => checkIn.challengeId === challengeId);
  }

  async findByDay(challengeId: string, dayNumber: number): Promise<CheckIn | null> {
    const ofChallenge = await this.findByChallenge(challengeId);
    return ofChallenge.find((checkIn) => checkIn.dayNumber === dayNumber) ?? null;
  }

  async findAll(): Promise<CheckIn[]> {
    return [...this.items.values()];
  }

  async save(checkIn: CheckIn): Promise<void> {
    this.items.set(checkIn.id, checkIn);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }

  async deleteAll(): Promise<void> {
    this.items.clear();
  }
}

export class InMemoryTimedCategoryRepository implements TimedCategoryRepository {
  readonly items: TimedCategory[] = [];

  async findAll(): Promise<TimedCategory[]> {
    return [...this.items];
  }

  async save(category: TimedCategory): Promise<void> {
    this.items.push(category);
  }

  async deleteAll(): Promise<void> {
    this.items.length = 0;
  }
}

export class InMemoryCheckOffCategoryRepository implements CheckOffCategoryRepository {
  readonly items: CustomCheckOffCategory[] = [];

  async findAll(): Promise<CustomCheckOffCategory[]> {
    return [...this.items];
  }

  async findById(id: string): Promise<CustomCheckOffCategory | null> {
    return this.items.find((category) => category.id === id) ?? null;
  }

  async save(category: CustomCheckOffCategory): Promise<void> {
    const index = this.items.findIndex(({ id }) => id === category.id);
    if (index === -1) {
      this.items.push(category);
    } else {
      this.items[index] = category;
    }
  }

  async delete(id: string): Promise<void> {
    const index = this.items.findIndex((category) => category.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  async deleteAll(): Promise<void> {
    this.items.length = 0;
  }
}

/** A clock that stays on whatever day the test sets. */
export class FakeClock implements Clock {
  constructor(public currentDate: LocalDate) {}

  today(): LocalDate {
    return this.currentDate;
  }
}

/** Ids 'id-1', 'id-2', ... so test expectations stay readable. */
export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  newId(): string {
    this.counter++;
    return `id-${this.counter}`;
  }
}

/** Remembers every beep instead of playing it. */
export class FakeSoundPlayer implements SoundPlayer {
  isUnlocked = false;
  readonly played: (CountdownCue | TimerCue | 'chime')[] = [];

  async unlock(): Promise<void> {
    this.isUnlocked = true;
  }

  playCountdown(cue: CountdownCue): void {
    this.played.push(cue);
  }

  playTimerCue(cue: TimerCue): void {
    this.played.push(cue);
  }

  playChime(): void {
    this.played.push('chime');
  }
}

/** Tells the test whether the screen would be kept on. */
export class FakeScreenWakeLock implements ScreenWakeLock {
  isHeld = false;

  async acquire(): Promise<void> {
    this.isHeld = true;
  }

  async release(): Promise<void> {
    this.isHeld = false;
  }
}

/** Keeps the shared file instead of opening a share sheet. */
export class FakeFileSharer implements FileSharer {
  readonly sharedFiles: { fileName: string; text: string }[] = [];
  outcome: ShareOutcome = 'shared';

  async shareText(fileName: string, text: string): Promise<ShareOutcome> {
    this.sharedFiles.push({ fileName, text });
    return this.outcome;
  }
}
