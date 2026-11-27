import { createAttempt, isTooShortToKeep } from './attempt';
import { DomainError } from './domain-error';
import { aChallenge } from './testing/domain-builders';

describe('attempt', () => {
  const challenge = aChallenge();
  const base = {
    id: 'a1',
    challenge,
    dayNumber: 12,
    recordedOn: '2026-11-27',
    durationSeconds: 74,
    source: 'timer' as const,
  };

  describe('BR-05: under 5 seconds is discarded', () => {
    it('treats 4 seconds as too short and 5 seconds as keepable', () => {
      expect(isTooShortToKeep(4)).toBe(true);
      expect(isTooShortToKeep(5)).toBe(false);
    });

    it('refuses to create an attempt under 5 seconds', () => {
      expect(() => createAttempt({ ...base, durationSeconds: 4 })).toThrow(DomainError);
    });

    it('refuses a time that is not whole seconds', () => {
      expect(() => createAttempt({ ...base, durationSeconds: 61.5 })).toThrow(DomainError);
    });
  });

  it('creates an on-time attempt with defaults for feeling and note', () => {
    const attempt = createAttempt(base);
    expect(attempt.isMakeUp).toBe(false);
    expect(attempt.feeling).toBe('none');
    expect(attempt.note).toBe('');
  });

  it('trims the note', () => {
    expect(createAttempt({ ...base, note: '  legs shaking  ' }).note).toBe('legs shaking');
  });

  describe('BR-07: make-up attempts', () => {
    it('marks an attempt for an earlier day as a make-up', () => {
      const attempt = createAttempt({ ...base, dayNumber: 4 });
      expect(attempt.isMakeUp).toBe(true);
    });

    it('refuses an attempt for a future day', () => {
      expect(() => createAttempt({ ...base, dayNumber: 13 })).toThrow(DomainError);
    });

    it('refuses an attempt recorded after the challenge has ended', () => {
      expect(() => createAttempt({ ...base, recordedOn: '2026-12-16' })).toThrow(DomainError);
    });
  });

  describe('BR-08: manual attempts', () => {
    it('keeps the manual source', () => {
      expect(createAttempt({ ...base, source: 'manual' }).source).toBe('manual');
    });

    it('rejects an unrealistic manual time', () => {
      expect(() => createAttempt({ ...base, durationSeconds: 3601 })).toThrow(DomainError);
    });
  });
});
