import { DomainError } from '../../domain';
import { createTestApp } from '../testing/test-app';

describe('RecordAttemptUseCase', () => {
  async function appOnDay12() {
    const app = createTestApp('2026-11-16');
    const challenge = await app.startChallenge.execute();
    app.clock.currentDate = '2026-11-27'; // Day 12
    return { app, challengeId: challenge.id };
  }

  it('BR-05: discards a timed attempt under 5 seconds without saving', async () => {
    const { app, challengeId } = await appOnDay12();

    const result = await app.recordAttempt.execute({
      challengeId,
      durationSeconds: 4,
      source: 'timer',
    });

    expect(result.status).toBe('too-short');
    expect(app.attempts.items.size).toBe(0);
  });

  it("saves a timed attempt for today's day", async () => {
    const { app, challengeId } = await appOnDay12();

    const result = await app.recordAttempt.execute({
      challengeId,
      durationSeconds: 74,
      source: 'timer',
      feeling: 'solid',
    });

    expect(result.status).toBe('saved');
    if (result.status === 'saved') {
      expect(result.attempt.dayNumber).toBe(12);
      expect(result.attempt.isMakeUp).toBe(false);
      expect(result.attempt.feeling).toBe('solid');
    }
  });

  it('reports a personal best only when it beats every earlier attempt', async () => {
    const { app, challengeId } = await appOnDay12();
    await app.recordAttempt.execute({ challengeId, durationSeconds: 72, source: 'timer' });

    const slower = await app.recordAttempt.execute({
      challengeId,
      durationSeconds: 70,
      source: 'timer',
    });
    const faster = await app.recordAttempt.execute({
      challengeId,
      durationSeconds: 74,
      source: 'timer',
    });

    expect(slower.status === 'saved' && slower.isPersonalBest).toBe(false);
    expect(faster.status === 'saved' && faster.isPersonalBest).toBe(true);
  });

  it('BR-17: compares the personal best within the same category only', async () => {
    const { app, challengeId: wallSquatId } = await appOnDay12();
    const plank = await app.startChallenge.execute(60, 'Plank');
    await app.recordAttempt.execute({
      challengeId: wallSquatId,
      durationSeconds: 90,
      source: 'timer',
    });

    const plankHold = await app.recordAttempt.execute({
      challengeId: plank.id,
      durationSeconds: 45,
      source: 'timer',
    });

    expect(plankHold.status === 'saved' && plankHold.isPersonalBest).toBe(true);
    expect(plankHold.status === 'saved' && plankHold.attempt.dayNumber).toBe(1);
  });

  it('BR-07: a timed attempt for an earlier day is a make-up', async () => {
    const { app, challengeId } = await appOnDay12();

    const result = await app.recordAttempt.execute({
      challengeId,
      durationSeconds: 65,
      source: 'timer',
      dayNumber: 4,
    });

    expect(result.status === 'saved' && result.attempt.isMakeUp).toBe(true);
  });

  it('BR-08: saves a manual attempt with source manual', async () => {
    const { app, challengeId } = await appOnDay12();

    const result = await app.recordAttempt.execute({
      challengeId,
      durationSeconds: 61,
      source: 'manual',
      dayNumber: 11,
    });

    expect(result.status === 'saved' && result.attempt.source).toBe('manual');
  });

  it('BR-05: rejects a manual attempt under 5 seconds with a message', async () => {
    const { app, challengeId } = await appOnDay12();

    await expect(
      app.recordAttempt.execute({
        challengeId,
        durationSeconds: 3,
        source: 'manual',
        dayNumber: 11,
      }),
    ).rejects.toThrow(DomainError);
  });

  it('fails clearly for an unknown challenge', async () => {
    const app = createTestApp();

    await expect(
      app.recordAttempt.execute({ challengeId: 'nope', durationSeconds: 60, source: 'timer' }),
    ).rejects.toThrow('Start a timed challenge');
  });
});
