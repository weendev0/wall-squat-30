import { Routes } from '@angular/router';
import {
  requireAttemptDraft,
  requireChallenge,
  requireChallengeDay,
  requireNoActiveChallenge,
} from './presentation/state/route-guards';
import { TabShell } from './presentation/shell/tab-shell';

/**
 * Every screen of the app. Screens are loaded only when first opened,
 * except the tab shell, which is always needed.
 */
export const routes: Routes = [
  {
    path: 'new-challenge',
    canActivate: [requireNoActiveChallenge],
    loadComponent: () =>
      import('./presentation/pages/new-challenge/new-challenge-page').then(
        (m) => m.NewChallengePage,
      ),
  },
  {
    path: 'timer',
    canActivate: [requireChallengeDay],
    loadComponent: () => import('./presentation/pages/timer/timer-page').then((m) => m.TimerPage),
  },
  {
    path: 'save-attempt',
    canActivate: [requireAttemptDraft],
    loadComponent: () =>
      import('./presentation/pages/save-attempt/save-attempt-page').then((m) => m.SaveAttemptPage),
  },
  {
    path: '',
    component: TabShell,
    canActivate: [requireChallenge],
    children: [
      {
        path: 'today',
        loadComponent: () =>
          import('./presentation/pages/today/today-page').then((m) => m.TodayPage),
      },
      {
        path: 'progress',
        data: { screenTitle: 'Progress' },
        loadComponent: () =>
          import('./presentation/pages/coming-soon/coming-soon-page').then((m) => m.ComingSoonPage),
      },
      {
        path: 'history',
        data: { screenTitle: 'History' },
        loadComponent: () =>
          import('./presentation/pages/coming-soon/coming-soon-page').then((m) => m.ComingSoonPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'today' },
    ],
  },
  { path: '**', redirectTo: '' },
];
