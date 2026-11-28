import { Component, DestroyRef, DOCUMENT, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

/**
 * Shows "A new version is ready" when the service worker has downloaded an update.
 *
 * Why: an iPhone Home Screen app can keep running the cached old version for a long
 * time. Removing and re-adding the icon to force an update deletes all saved data,
 * so the app must offer the update itself. Reloading keeps the data: it lives in
 * IndexedDB, not in the app files.
 */
@Component({
  selector: 'app-update-banner',
  template: `
    @if (updateReady()) {
      <div class="update-banner" role="status">
        <span>A new version is ready</span>
        <button type="button" (click)="reload()">Reload</button>
      </div>
    }
  `,
  styles: `
    .update-banner {
      position: fixed;
      top: calc(env(safe-area-inset-top) + 8px);
      left: 16px;
      right: 16px;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 14px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      box-shadow: 0 6px 20px rgb(0 0 0 / 25%);
    }
    button {
      border: 0;
      border-radius: 10px;
      padding: 8px 14px;
      font: inherit;
      font-weight: 600;
      background: var(--color-accent);
      color: var(--color-on-accent);
    }
  `,
})
export class UpdateBanner {
  private readonly swUpdate = inject(SwUpdate);
  private readonly document = inject(DOCUMENT);

  readonly updateReady = signal(false);

  constructor() {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.updateReady.set(true));

    this.checkForUpdate();
    this.checkEachTimeTheAppComesBack();
  }

  reload(): void {
    this.document.location.reload();
  }

  /** iOS rarely restarts a Home Screen app, so also check when it returns to the screen. */
  private checkEachTimeTheAppComesBack(): void {
    const onVisible = () => {
      if (this.document.visibilityState === 'visible') {
        this.checkForUpdate();
      }
    };
    this.document.addEventListener('visibilitychange', onVisible);
    inject(DestroyRef).onDestroy(() =>
      this.document.removeEventListener('visibilitychange', onVisible),
    );
  }

  private checkForUpdate(): void {
    // Offline or a failed check is fine: the next check tries again.
    this.swUpdate.checkForUpdate().catch(() => undefined);
  }
}
