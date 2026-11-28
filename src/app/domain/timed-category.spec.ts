import { DomainError } from './domain-error';
import { createTimedCategory, isSameCategoryName, timedCategoryNames } from './timed-category';

describe('timed categories (BR-15)', () => {
  it('trims the name and refuses an empty or too long one', () => {
    expect(createTimedCategory('c-1', '  Plank ')).toEqual({ id: 'c-1', name: 'Plank' });
    expect(() => createTimedCategory('c-1', '   ')).toThrow(DomainError);
    expect(() => createTimedCategory('c-1', 'x'.repeat(41))).toThrow(DomainError);
  });

  it('compares names ignoring case and spaces around them', () => {
    expect(isSameCategoryName('Wall Squat', 'Wall Squat')).toBe(true);
    expect(isSameCategoryName(' plank', 'Plank ')).toBe(true);
    expect(isSameCategoryName('Plank', 'Side plank')).toBe(false);
  });

  it('offers Wall Squat first, then the saved names once each', () => {
    const saved = [
      { id: 'c-1', name: 'Plank' },
      { id: 'c-2', name: 'wall squat' },
      { id: 'c-3', name: 'Lunge hold' },
    ];

    expect(timedCategoryNames(saved)).toEqual(['Wall Squat', 'Plank', 'Lunge hold']);
  });
});
