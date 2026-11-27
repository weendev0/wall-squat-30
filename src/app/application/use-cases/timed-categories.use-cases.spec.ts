import { DomainError } from '../../domain';
import { createTestApp } from '../testing/test-app';

describe('timed category use cases (BR-15)', () => {
  it('offers Wall Squat before anything is added', async () => {
    const app = createTestApp();
    expect(await app.getTimedCategories.execute()).toEqual(['Wall Squat']);
  });

  it('saves a new category, trimmed, and offers it next time', async () => {
    const app = createTestApp();

    expect(await app.addTimedCategory.execute('  Plank ')).toBe('Plank');

    expect(await app.getTimedCategories.execute()).toEqual(['Wall Squat', 'Plank']);
  });

  it('does not save the same name twice, and returns the existing spelling', async () => {
    const app = createTestApp();
    await app.addTimedCategory.execute('Plank');

    expect(await app.addTimedCategory.execute('plank')).toBe('Plank');
    expect(await app.addTimedCategory.execute('WALL SQUAT')).toBe('Wall Squat');
    expect(app.categories.items).toHaveLength(1);
  });

  it('refuses an empty name', async () => {
    const app = createTestApp();
    await expect(app.addTimedCategory.execute('   ')).rejects.toThrow(DomainError);
  });
});
