import { DomainError } from './domain-error';
import { addDays, assertLocalDate, daysBetween, toLocalDate } from './local-date';

describe('local-date', () => {
  it('accepts a real YYYY-MM-DD date', () => {
    expect(() => assertLocalDate('2026-11-27')).not.toThrow();
  });

  it.each(['2026-02-30', '27-11-2026', '2026-11-27T10:00', ''])('rejects "%s"', (value) => {
    expect(() => assertLocalDate(value)).toThrow(DomainError);
  });

  it('adds days across a month and a year end', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-12-01', -1)).toBe('2026-11-30');
  });

  it('counts the days between two dates', () => {
    expect(daysBetween('2026-11-16', '2026-11-27')).toBe(11);
    expect(daysBetween('2026-11-27', '2026-11-16')).toBe(-11);
  });

  it('uses the phone time zone to find the calendar day', () => {
    const lateEvening = new Date(2026, 10, 27, 23, 59);
    expect(toLocalDate(lateEvening)).toBe('2026-11-27');
  });
});
