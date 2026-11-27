import { DomainError } from './domain-error';
import { formatDuration, toTotalSeconds } from './duration-format';

describe('duration-format (BR-12)', () => {
  it.each([
    [0, '0:00'],
    [5, '0:05'],
    [60, '1:00'],
    [74, '1:14'],
    [600, '10:00'],
  ])('shows %i seconds as %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });

  it('turns minutes and seconds into whole seconds', () => {
    expect(toTotalSeconds(1, 15)).toBe(75);
    expect(toTotalSeconds(0, 45)).toBe(45);
  });

  it.each([
    [1, 60],
    [-1, 0],
    [1.5, 0],
  ])('rejects %d minutes and %d seconds', (minutes, seconds) => {
    expect(() => toTotalSeconds(minutes, seconds)).toThrow(DomainError);
  });
});
