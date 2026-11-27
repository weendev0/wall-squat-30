import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { UpdateBanner } from './update-banner';

class FakeSwUpdate {
  isEnabled = true;
  readonly versionUpdates = new Subject<VersionEvent>();
  checks = 0;

  checkForUpdate(): Promise<boolean> {
    this.checks++;
    return Promise.resolve(false);
  }
}

describe('UpdateBanner', () => {
  let swUpdate: FakeSwUpdate;

  function render() {
    TestBed.configureTestingModule({ providers: [{ provide: SwUpdate, useValue: swUpdate }] });
    const fixture = TestBed.createComponent(UpdateBanner);
    fixture.detectChanges();
    return fixture;
  }

  function versionReady(): VersionEvent {
    const version = { hash: 'new' };
    return { type: 'VERSION_READY', currentVersion: { hash: 'old' }, latestVersion: version };
  }

  beforeEach(() => (swUpdate = new FakeSwUpdate()));

  it('stays hidden until a new version has downloaded', () => {
    const fixture = render();

    expect(fixture.nativeElement.textContent).not.toContain('A new version is ready');

    swUpdate.versionUpdates.next(versionReady());
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('A new version is ready');
    expect(fixture.nativeElement.querySelector('button').textContent).toContain('Reload');
  });

  it('ignores other update events', () => {
    const fixture = render();

    swUpdate.versionUpdates.next({ type: 'VERSION_DETECTED', version: { hash: 'new' } });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('A new version is ready');
  });

  it('checks on start and again each time the app comes back to the screen', () => {
    render();
    expect(swUpdate.checks).toBe(1);

    document.dispatchEvent(new Event('visibilitychange'));

    expect(swUpdate.checks).toBe(2);
  });

  it('does nothing when the service worker is off', () => {
    swUpdate.isEnabled = false;

    render();

    expect(swUpdate.checks).toBe(0);
  });
});
