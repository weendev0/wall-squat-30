import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { provideWallSquatTesting } from '../../composition/testing/provide-wall-squat-testing';
import { THEME_STORAGE } from '../state/theme-store';

/**
 * Sets up the whole app with fakes, as on `today`. Call it in beforeEach,
 * add any data the test needs, then open a screen with openScreen().
 */
export function setUpApp(today = '2026-11-16') {
  const { providers, fakes } = provideWallSquatTesting(today);
  TestBed.configureTestingModule({
    providers: [
      ...providers,
      provideRouter(routes, withComponentInputBinding()),
      // Screen tests never touch the real browser storage.
      { provide: THEME_STORAGE, useValue: null },
    ],
  });
  return fakes;
}

/** Opens `url` like the user would and waits until the screen has rendered. */
export async function openScreen(url: string) {
  const harness = await RouterTestingHarness.create(url);
  await harness.fixture.whenStable();
  const router = TestBed.inject(Router);

  return {
    harness,
    /** The address the app ended up on, after any redirects. */
    currentUrl: () => router.url,
    /** Everything on screen as one string, one space between each piece of text. */
    text: () => visibleText(harness.routeNativeElement),
    /**
     * The button (or link) whose text or aria-label matches, e.g. button('START'). Text from
     * separate elements inside it is joined with one space. Throws when missing.
     */
    button: (label: string) => findButton(harness.routeNativeElement, label),
    hasButton: (label: string) => findButtonOrNull(harness.routeNativeElement, label) !== null,
    /** Clicks, then waits for everything the click started (saving, navigation, rendering). */
    click: async (label: string) => {
      findButton(harness.routeNativeElement, label).click();
      await harness.fixture.whenStable();
      await harness.fixture.whenStable();
    },
  };
}

function visibleText(root: HTMLElement | null): string {
  if (root === null) {
    return '';
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const pieces: string[] = [];
  while (walker.nextNode()) {
    pieces.push(walker.currentNode.textContent ?? '');
  }
  return pieces.join(' ').replace(/\s+/g, ' ').trim();
}

function findButtonOrNull(root: HTMLElement | null, label: string): HTMLElement | null {
  const candidates = [...(root?.querySelectorAll<HTMLElement>('button, a') ?? [])];
  return (
    candidates.find(
      (element) => visibleText(element) === label || element.getAttribute('aria-label') === label,
    ) ?? null
  );
}

function findButton(root: HTMLElement | null, label: string): HTMLElement {
  const button = findButtonOrNull(root, label);
  if (button === null) {
    throw new Error(`No button "${label}" on screen.`);
  }
  return button;
}
