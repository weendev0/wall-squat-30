import { DOCUMENT, effect, inject, Injectable, InjectionToken, signal } from '@angular/core';

/** The two looks of the app (spec section 13). */
export type Theme = 'cute' | 'dark';

/** Cute is what a new install shows. */
export const DEFAULT_THEME: Theme = 'cute';

/** The key under which the chosen look is remembered. index.html reads it too. */
export const THEME_STORAGE_KEY = '30dc-theme';

/** The colour of the iPhone status bar and app switcher for each look. */
export const THEME_BAR_COLORS: Record<Theme, string> = { cute: '#fff6f0', dark: '#121317' };

/**
 * Where the chosen look is kept: the browser's localStorage, which stays on the phone.
 * It is only a preference, so a phone that refuses storage simply gets the default look.
 */
export const THEME_STORAGE = new InjectionToken<Storage | null>('ThemeStorage', {
  providedIn: 'root',
  factory: () => {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null; // private mode or blocked storage
    }
  },
});

/**
 * Knows which look is on, remembers the user's choice and applies it to the page
 * by setting data-theme on <html> (the colours themselves live in styles.scss).
 */
@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly storage = inject(THEME_STORAGE);
  private readonly document = inject(DOCUMENT);

  private readonly themeState = signal<Theme>(this.readSavedTheme());
  readonly theme = this.themeState.asReadonly();

  constructor() {
    effect(() => this.apply(this.themeState()));
  }

  setTheme(theme: Theme): void {
    this.themeState.set(theme);
    try {
      this.storage?.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Not saved; the look still changes until the app is closed.
    }
  }

  private readSavedTheme(): Theme {
    try {
      const saved = this.storage?.getItem(THEME_STORAGE_KEY);
      return saved === 'dark' || saved === 'cute' ? saved : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  }

  private apply(theme: Theme): void {
    this.document.documentElement.dataset['theme'] = theme;
    this.document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_BAR_COLORS[theme]);
  }
}
