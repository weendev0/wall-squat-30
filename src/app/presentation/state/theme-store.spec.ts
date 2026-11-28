import { TestBed } from '@angular/core/testing';
import { THEME_STORAGE, THEME_STORAGE_KEY, ThemeStore } from './theme-store';

describe('ThemeStore', () => {
  let storage: Map<string, string>;

  function createStore(saved?: string): ThemeStore {
    storage = new Map(saved ? [[THEME_STORAGE_KEY, saved]] : []);
    const fakeStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    } as unknown as Storage;
    TestBed.configureTestingModule({
      providers: [{ provide: THEME_STORAGE, useValue: fakeStorage }],
    });
    const store = TestBed.inject(ThemeStore);
    TestBed.tick(); // runs the effect that applies the look
    return store;
  }

  afterEach(() => delete document.documentElement.dataset['theme']);

  it('starts in cute mode on a new install', () => {
    const store = createStore();

    expect(store.theme()).toBe('cute');
    expect(document.documentElement.dataset['theme']).toBe('cute');
  });

  it('opens in the look chosen last time', () => {
    expect(createStore('dark').theme()).toBe('dark');
  });

  it('ignores a value it does not know', () => {
    expect(createStore('neon').theme()).toBe('cute');
  });

  it('switches the page and remembers the choice', () => {
    const store = createStore();

    store.setTheme('dark');
    TestBed.tick();

    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(storage.get(THEME_STORAGE_KEY)).toBe('dark');
  });
});
