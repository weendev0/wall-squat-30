import { DomainError } from '../../domain';
import { createTestApp } from '../testing/test-app';

describe('StartChallengeUseCase', () => {
  it('starts today with a 1:00 target by default', async () => {
    const app = createTestApp('2026-11-27');

    const challenge = await app.startChallenge.execute();

    expect(challenge.startDate).toBe('2026-11-27');
    expect(challenge.targetSeconds).toBe(60);
    expect(await app.challenges.findActive()).toEqual(challenge);
  });

  it('accepts another target, set to the second', async () => {
    const app = createTestApp();
    expect((await app.startChallenge.execute(75)).targetSeconds).toBe(75);
  });

  it('refuses a second challenge while one is running', async () => {
    const app = createTestApp();
    await app.startChallenge.execute();

    await expect(app.startChallenge.execute()).rejects.toThrow(DomainError);
  });
});
