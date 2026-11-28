import { DomainError } from '../../domain';
import { createTestApp } from '../testing/test-app';

describe('StartChallengeUseCase', () => {
  it('starts today with a 1:00 target by default', async () => {
    const app = createTestApp('2026-11-27');

    const challenge = await app.startChallenge.execute();

    expect(challenge.startDate).toBe('2026-11-27');
    expect(challenge.targetSeconds).toBe(60);
    expect(await app.challenges.findById(challenge.id)).toEqual(challenge);
  });

  it('accepts another target, set to the second', async () => {
    const app = createTestApp();
    expect((await app.startChallenge.execute(75)).targetSeconds).toBe(75);
  });

  it('is named "Wall Squat" unless another name is given', async () => {
    const app = createTestApp();
    expect((await app.startChallenge.execute()).name).toBe('Wall Squat');

    const other = createTestApp();
    expect((await other.startChallenge.execute(60, '  Plank ')).name).toBe('Plank');
  });

  it('starts beside a running check-off challenge (BR-13)', async () => {
    const app = createTestApp();
    await app.startCheckOffChallenge.execute({ name: 'Atomic Habits', category: 'reading' });

    await expect(app.startChallenge.execute()).resolves.toMatchObject({ kind: 'timed' });
  });

  it('BR-16: refuses a second challenge in the same category while one is running', async () => {
    const app = createTestApp();
    await app.startChallenge.execute();

    await expect(app.startChallenge.execute()).rejects.toThrow(DomainError);
  });

  it('BR-16: runs other categories beside it, and spots the same name in any case', async () => {
    const app = createTestApp();
    await app.startChallenge.execute(60, 'Wall Squat');

    await expect(app.startChallenge.execute(45, 'Plank')).resolves.toMatchObject({ name: 'Plank' });
    await expect(app.startChallenge.execute(60, 'wall squat')).rejects.toThrow(
      'A Wall Squat challenge is already running',
    );
  });
});
