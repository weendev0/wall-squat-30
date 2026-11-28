import {
  assertCategoryNameIsFree,
  createCustomCheckOffCategory,
  editCustomCheckOffCategory,
  isCountedGoal,
} from './check-off-category';
import { DomainError } from './domain-error';
import { aWaterCategory, waterFields } from './testing/domain-builders';

describe('your own check-off categories', () => {
  describe('BR-21: name, colour and icon', () => {
    it('trims the name and keeps the colour and icon', () => {
      const category = createCustomCheckOffCategory('c-1', waterFields({ name: '  Water  ' }));

      expect(category).toEqual({
        id: 'c-1',
        name: 'Water',
        tone: 'sky',
        icon: '💧',
        dailyGoal: 8,
        unit: 'glasses',
      });
    });

    it('refuses an empty or too long name', () => {
      expect(() => aWaterCategory({ name: '  ' })).toThrow(DomainError);
      expect(() => aWaterCategory({ name: 'x'.repeat(41) })).toThrow(DomainError);
    });

    it('refuses a colour or icon that is not on the list', () => {
      expect(() => aWaterCategory({ tone: 'neon' as never })).toThrow(DomainError);
      expect(() => aWaterCategory({ icon: '🚀' })).toThrow(DomainError);
    });
  });

  describe('BR-21: names are unique, ignoring case', () => {
    const water = aWaterCategory();

    it('refuses a built-in name', () => {
      expect(() => assertCategoryNameIsFree('reading', [])).toThrow(
        'There is already a category called Reading.',
      );
    });

    it('refuses the name of another category of yours', () => {
      expect(() => assertCategoryNameIsFree(' water drinking ', [water])).toThrow(DomainError);
    });

    it('lets a category keep its own name when edited', () => {
      expect(() => assertCategoryNameIsFree('Water Drinking', [water], water.id)).not.toThrow();
    });
  });

  describe('BR-22: Just Done or count to a goal', () => {
    it('treats a goal of 1 as Just Done and drops the unit', () => {
      const meditate = aWaterCategory({ name: 'Meditate', dailyGoal: 1, unit: 'times' });

      expect(isCountedGoal(meditate.dailyGoal)).toBe(false);
      expect(meditate.unit).toBe('');
    });

    it('needs a unit when counting', () => {
      expect(isCountedGoal(8)).toBe(true);
      expect(() => aWaterCategory({ unit: '  ' })).toThrow(DomainError);
    });

    it('refuses a goal below 1, above 50 or with a fraction', () => {
      expect(() => aWaterCategory({ dailyGoal: 0 })).toThrow(DomainError);
      expect(() => aWaterCategory({ dailyGoal: 51 })).toThrow(DomainError);
      expect(() => aWaterCategory({ dailyGoal: 2.5 })).toThrow(DomainError);
    });
  });

  it('BR-24: editing checks the fields again and keeps the id', () => {
    const edited = editCustomCheckOffCategory(aWaterCategory(), waterFields({ dailyGoal: 6 }));

    expect(edited).toMatchObject({ id: 'water', dailyGoal: 6 });
    expect(() => editCustomCheckOffCategory(edited, waterFields({ name: '' }))).toThrow(
      DomainError,
    );
  });
});
