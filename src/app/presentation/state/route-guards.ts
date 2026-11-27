import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AttemptDraftStore } from './attempt-draft-store';
import { ChallengeStore } from './challenge-store';

/**
 * Route guards decide which screen may open.
 * Note: inject() only works before the first `await`, so each guard reads what it needs first.
 */

/** Today, Progress and History need a challenge; without one the app opens New challenge. */
export const requireChallenge: CanActivateFn = async () => {
  const router = inject(Router);
  const overview = await inject(ChallengeStore).load();
  return overview !== null ? true : router.createUrlTree(['/new-challenge']);
};

/** New challenge is only for when no challenge is running (one active challenge at a time). */
export const requireNoActiveChallenge: CanActivateFn = async () => {
  const router = inject(Router);
  const overview = await inject(ChallengeStore).load();
  return overview?.challenge.status === 'active' ? router.createUrlTree(['/today']) : true;
};

/** The timer needs a challenge day to record into. */
export const requireChallengeDay: CanActivateFn = async () => {
  const router = inject(Router);
  const overview = await inject(ChallengeStore).load();
  return overview?.todayDayNumber ? true : router.createUrlTree(['/today']);
};

/** Save attempt only makes sense right after the timer was stopped. */
export const requireAttemptDraft: CanActivateFn = () => {
  const hasDraft = inject(AttemptDraftStore).draft() !== null;
  return hasDraft ? true : inject(Router).createUrlTree(['/today']);
};
