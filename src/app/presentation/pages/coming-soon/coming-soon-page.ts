import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Stands in for Progress and History until their pull request lands. */
@Component({
  selector: 'app-coming-soon-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="screen screen-in-tabs">
      <h1 class="screen-title">{{ screenTitle() }}</h1>
      <p class="muted">This screen is coming in the next update.</p>
    </main>
  `,
})
export class ComingSoonPage {
  /** Filled from the route's data (see app.routes.ts). */
  readonly screenTitle = input('');
}
