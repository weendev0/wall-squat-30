import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { setUpApp } from './presentation/testing/screen-test-helpers';

describe('App', () => {
  beforeEach(() => {
    setUpApp();
  });

  it('starts with a router outlet for the screens', () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });
});
