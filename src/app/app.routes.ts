import { Routes } from '@angular/router';
import {
  requireAttemptDraft,
  requireCelebration,
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
    path: 'celebration',
    canActivate: [requireCelebration],
    loadComponent: () =>
      import('./presentation/pages/celebration/celebration-page').then((m) => m.CelebrationPage),
  },
  {
    path: 'sessions',
    loadComponent: () =>
      import('./presentation/pages/sessions/sessions-page').then((m) => m.SessionsPage),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./presentation/pages/settings/settings-page').then((m) => m.SettingsPage),
  },
  {
    path: 'add-attempt',
    canActivate: [requireChallengeDay],
    loadComponent: () =>
      import('./presentation/pages/add-attempt/add-attempt-page').then((m) => m.AddAttemptPage),
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
        loadComponent: () =>
          import('./presentation/pages/progress/progress-page').then((m) => m.ProgressPage),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./presentation/pages/history/history-page').then((m) => m.HistoryPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'today' },
    ],
  },
  { path: '**', redirectTo: '' },
];
