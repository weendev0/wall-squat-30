import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AttemptDraftStore } from './attempt-draft-store';
import { ChallengeStore } from './challenge-store';
import { CheckOffStore } from './check-off-store';

/**
 * Route guards decide which screen may open.
 * Note: inject() only works before the first `await`, so each guard reads what it needs first.
 */

/**
 * Today, Progress and History need at least one challenge; without one the app opens
 * New challenge. Right after a challenge's day 30 its Celebration comes first (BR-10, BR-18).
 */
export const requireChallenge: CanActivateFn = async () => {
  const router = inject(Router);
  const challengeStore = inject(ChallengeStore);
  const checkOffStore = inject(CheckOffStore);
  const [wallSquat] = await Promise.all([challengeStore.load(), checkOffStore.load()]);

  if (wallSquat?.needsCelebration) {
    return router.createUrlTree(['/celebration']);
  }
  const finished = checkOffStore.awaitingCelebration();
  if (finished !== null) {
    return router.createUrlTree(['/celebration', finished.challenge.id]);
  }
  // Finished check-off challenges count too, so their notes stay readable in History.
  const hasAnyChallenge = wallSquat !== null || checkOffStore.overviews().length > 0;
  return hasAnyChallenge ? true : router.createUrlTree(['/new-challenge']);
};

/** The Celebration screen only opens once, for a challenge that has just finished (BR-10). */
export const requireCelebration: CanActivateFn = async () => {
  const router = inject(Router);
  const overview = await inject(ChallengeStore).load();
  return overview?.needsCelebration ? true : router.createUrlTree(['/today']);
};

/** BR-18: a finished check-off challenge's celebration, shown once. */
export const requireCheckOffCelebration: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const store = inject(CheckOffStore);
  await store.load();
  const overview = store.find(route.paramMap.get('challengeId') ?? '');
  return overview?.needsCelebration ? true : router.createUrlTree(['/today']);
};

/** New challenge needs both stores loaded, to know whether a wall squat is already running. */
export const loadChallenges: CanActivateFn = async () => {
  const challengeStore = inject(ChallengeStore);
  const checkOffStore = inject(CheckOffStore);
  await Promise.all([challengeStore.load(), checkOffStore.load()]);
  return true;
};

/** Check-in needs a running check-off challenge with a day to record (BR-14). */
export const requireCheckOffDay: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const store = inject(CheckOffStore);
  await store.load();
  const overview = store.find(route.paramMap.get('challengeId') ?? '');
  return overview?.todayDayNumber ? true : router.createUrlTree(['/today']);
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
