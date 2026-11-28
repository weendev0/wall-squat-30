import { DomainError } from '../../domain';
import { waterFields } from '../../domain/testing/domain-builders';
import { createTestApp } from '../testing/test-app';

describe('your own check-off categories (BR-21 to BR-24)', () => {
  describe('adding', () => {
    it('BR-21: saves a category and offers it next time', async () => {
      const app = createTestApp();

      const water = await app.addCheckOffCategory.execute(waterFields());

      expect(water).toMatchObject({ id: 'id-1', name: 'Water Drinking', dailyGoal: 8 });
      expect(await app.getCheckOffCategories.execute()).toEqual([
        { category: water, isInUse: false },
      ]);
    });

    it('BR-21: refuses a name that is already taken, ignoring case', async () => {
      const app = createTestApp();
      await app.addCheckOffCategory.execute(waterFields());

      await expect(
        app.addCheckOffCategory.execute(waterFields({ name: 'water drinking' })),
      ).rejects.toThrow(DomainError);
      await expect(app.addCheckOffCategory.execute(waterFields({ name: 'STUDY' }))).rejects.toThrow(
        DomainError,
      );
      expect(app.checkOffCategories.items).toHaveLength(1);
    });
  });

  describe('editing', () => {
    it('BR-24: changes the category in place and keeps its id', async () => {
      const app = createTestApp();
      const water = await app.addCheckOffCategory.execute(waterFields());

      await app.editCheckOffCategory.execute(
        water.id,
        waterFields({ name: 'Water', tone: 'mint' }),
      );

      expect(app.checkOffCategories.items).toEqual([{ ...water, name: 'Water', tone: 'mint' }]);
    });

    it('BR-22: a running challenge keeps the goal it started with', async () => {
      const app = createTestApp();
      const water = await app.addCheckOffCategory.execute(waterFields());
      await app.startCheckOffChallenge.execute({ name: 'Water', customCategoryId: water.id });

      await app.editCheckOffCategory.execute(water.id, waterFields({ dailyGoal: 6 }));

      const [overview] = await app.getCheckOffOverviews.execute();
      expect(overview.challenge.dailyGoal).toBe(8);
    });

    it('refuses a category that no longer exists', async () => {
      const app = createTestApp();
      await expect(app.editCheckOffCategory.execute('gone', waterFields())).rejects.toThrow(
        DomainError,
      );
    });
  });

  describe('deleting', () => {
    it('BR-24: deletes a category no challenge uses', async () => {
      const app = createTestApp();
      const water = await app.addCheckOffCategory.execute(waterFields());

      await app.deleteCheckOffCategory.execute(water.id);

      expect(await app.getCheckOffCategories.execute()).toEqual([]);
    });

    it('BR-24: keeps a category that a challenge uses', async () => {
      const app = createTestApp();
      const water = await app.addCheckOffCategory.execute(waterFields());
      await app.startCheckOffChallenge.execute({ name: 'Water', customCategoryId: water.id });

      expect((await app.getCheckOffCategories.execute())[0].isInUse).toBe(true);
      await expect(app.deleteCheckOffCategory.execute(water.id)).rejects.toThrow(DomainError);
      expect(app.checkOffCategories.items).toHaveLength(1);
    });
  });

  describe('starting and counting', () => {
    it('BR-21: starts a challenge in the category and shows it on the overview', async () => {
      const app = createTestApp();
      const water = await app.addCheckOffCategory.execute(waterFields());

      const challenge = await app.startCheckOffChallenge.execute({
        name: 'Water Drinking',
        customCategoryId: water.id,
      });
      const [overview] = await app.getCheckOffOverviews.execute();

      expect(challenge).toMatchObject({ category: 'custom', dailyGoal: 8, unit: 'glasses' });
      expect(overview.customCategory).toEqual(water);
    });

    it('refuses to start in a category that no longer exists', async () => {
      const app = createTestApp();
      await expect(
        app.startCheckOffChallenge.execute({ name: 'Water', customCategoryId: 'gone' }),
      ).rejects.toThrow(DomainError);
    });

    it('BR-23: saves the count of the day, which is done once it reaches the goal', async () => {
      const app = createTestApp();
      const water = await app.addCheckOffCategory.execute(waterFields());
      const challenge = await app.startCheckOffChallenge.execute({
        name: 'Water',
        customCategoryId: water.id,
      });

      await app.checkIn.execute({ challengeId: challenge.id, count: 3 });
      let [overview] = await app.getCheckOffOverviews.execute();
      expect(overview.days[0].status).toBe('under-target');

      await app.checkIn.execute({ challengeId: challenge.id, count: 8, note: 'Hot day' });
      [overview] = await app.getCheckOffOverviews.execute();
      expect(overview.days[0].status).toBe('complete');
      expect(overview.checkIns[0]).toMatchObject({ count: 8, note: 'Hot day' });
      expect(app.checkIns.items.size).toBe(1);
    });

    it('BR-23: saving only a note keeps the count', async () => {
      const app = createTestApp();
      const water = await app.addCheckOffCategory.execute(waterFields());
      const challenge = await app.startCheckOffChallenge.execute({
        name: 'Water',
        customCategoryId: water.id,
      });
      await app.checkIn.execute({ challengeId: challenge.id, count: 5 });

      const checkIn = await app.checkIn.execute({ challengeId: challenge.id, note: 'Half way' });

      expect(checkIn).toMatchObject({ count: 5, note: 'Half way' });
    });

    it('BR-11: reset all history removes your categories too', async () => {
      const app = createTestApp();
      await app.addCheckOffCategory.execute(waterFields());

      await app.resetHistory.execute();

      expect(app.checkOffCategories.items).toEqual([]);
    });

    it('CSV: names your category and writes the count', async () => {
      const app = createTestApp('2026-11-23');
      const water = await app.addCheckOffCategory.execute(waterFields());
      const challenge = await app.startCheckOffChallenge.execute({
        name: 'Water',
        customCategoryId: water.id,
      });
      await app.checkIn.execute({ challengeId: challenge.id, count: 6 });

      const csv = await app.exportCsv.execute();

      expect(csv.split('\n')[1]).toBe(
        'Water,Water Drinking,2026-11-23,,1,2026-11-23,2026-11-23,,,check-in,no,,,6',
      );
    });
  });
});
