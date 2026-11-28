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
 * Loads every challenge before Today, Progress or History opens. The app always opens on
 * Today, even with no challenge yet (it then shows an empty list with an add button).
 * Right after a challenge's day 30 its Celebration comes first (BR-10, BR-18).
 */
export const loadChallengesCelebratingFirst: CanActivateFn = async () => {
  const router = inject(Router);
  const challengeStore = inject(ChallengeStore);
  const checkOffStore = inject(CheckOffStore);
  await Promise.all([challengeStore.load(), checkOffStore.load()]);

  const finished = challengeStore.awaitingCelebration() ?? checkOffStore.awaitingCelebration();
  if (finished !== null) {
    return router.createUrlTree(['/celebration', finished.challenge.id]);
  }
  return true;
};

/**
 * The Celebration screen only opens once, for a challenge that has just finished:
 * timed (BR-10) or check-off (BR-18).
 */
export const requireCelebration: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const challengeStore = inject(ChallengeStore);
  const checkOffStore = inject(CheckOffStore);
  await Promise.all([challengeStore.load(), checkOffStore.load()]);
  const id = challengeIdOf(route);
  const overview = challengeStore.find(id) ?? checkOffStore.find(id);
  return overview?.needsCelebration ? true : router.createUrlTree(['/today']);
};

/** New challenge needs both stores loaded, to know which categories are already running. */
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
  const overview = store.find(challengeIdOf(route));
  return overview?.todayDayNumber ? true : router.createUrlTree(['/today']);
};

/** The timer and Add attempt need a running timed challenge with a day to record into. */
export const requireChallengeDay: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const store = inject(ChallengeStore);
  await store.load();
  const overview = store.find(challengeIdOf(route));
  return overview?.todayDayNumber ? true : router.createUrlTree(['/today']);
};

/** Save attempt only makes sense right after the timer was stopped. */
export const requireAttemptDraft: CanActivateFn = () => {
  const hasDraft = inject(AttemptDraftStore).draft() !== null;
  return hasDraft ? true : inject(Router).createUrlTree(['/today']);
};

/** The :challengeId part of the address. */
export function challengeIdOf(route: ActivatedRouteSnapshot): string {
  return route.paramMap.get('challengeId') ?? '';
}
