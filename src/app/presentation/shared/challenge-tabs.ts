import { ChangeDetectionStrategy, Component, computed, inject, input, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChallengeOverview, CheckOffOverview } from '../../application';
import { ChallengeCategory } from '../../domain';
import { ChallengeStore } from '../state/challenge-store';
import { CheckOffStore } from '../state/check-off-store';
import { toneClass } from './challenge-category';

/** Which challenge Progress or History shows. */
export type ChallengeSelection =
  | { readonly kind: 'timed'; readonly overview: ChallengeOverview }
  | { readonly kind: 'checkoff'; readonly overview: CheckOffOverview }
  | null;

/**
 * Picks the challenge named by ?challenge=<id>. Without one (or with an unknown id)
 * it falls back to the wall squat, then to the first check-off challenge.
 */
export function selectChallenge(
  selectedId: string | undefined,
  wallSquat: ChallengeOverview | null,
  checkOffs: readonly CheckOffOverview[],
): ChallengeSelection {
  const checkOff = checkOffs.find((overview) => overview.challenge.id === selectedId);
  if (checkOff) {
    return { kind: 'checkoff', overview: checkOff };
  }
  if (wallSquat) {
    return { kind: 'timed', overview: wallSquat };
  }
  return checkOffs.length > 0 ? { kind: 'checkoff', overview: checkOffs[0] } : null;
}

/** What Progress and History need to know about the selected challenge. */
export interface SelectedChallenge {
  /** The id of the selected tab, or null when there is no challenge at all. */
  readonly id: Signal<string | null>;
  /** The selected check-off challenge, or null when the wall squat is selected. */
  readonly checkOff: Signal<CheckOffOverview | null>;
  /** The tone class of the selected challenge, so the whole screen takes its colour. */
  readonly tone: Signal<string>;
}

/** Follows ?challenge=<id> and the stores, and works out what Progress or History shows. */
export function selectedChallenge(
  selectedId: Signal<string | undefined>,
  wallSquat: Signal<ChallengeOverview | null>,
  checkOffs: Signal<readonly CheckOffOverview[]>,
): SelectedChallenge {
  const selection = computed(() => selectChallenge(selectedId(), wallSquat(), checkOffs()));
  return {
    id: computed(() => selection()?.overview.challenge.id ?? null),
    checkOff: computed(() => {
      const current = selection();
      return current?.kind === 'checkoff' ? current.overview : null;
    }),
    tone: computed(() => toneClass(selection()?.overview.challenge.category ?? 'exercise')),
  };
}

interface Tab {
  readonly id: string;
  readonly label: string;
  readonly category: ChallengeCategory;
}

/**
 * The row of challenge tabs at the top of Progress and History (canvas board 15).
 * Each tab is a link that sets ?challenge=<id>; it is hidden when there is only one challenge.
 */
@Component({
  selector: 'app-challenge-tabs',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (tabs().length > 1) {
      <nav class="tabs" aria-label="Challenge">
        @for (tab of tabs(); track tab.id) {
          <a
            class="tab"
            [class]="toneClass(tab.category)"
            [class.selected]="tab.id === selectedId()"
            [attr.aria-current]="tab.id === selectedId() ? 'page' : null"
            routerLink="."
            [queryParams]="{ challenge: tab.id }"
            >{{ tab.label }}</a
          >
        }
      </nav>
    }
  `,
  styles: `
    .tabs {
      display: flex;
      gap: 8px;
      margin: 0 -20px;
      padding: 0 20px;
      overflow-x: auto;
    }
    .tab {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      height: 36px;
      padding: 0 14px;
      border: 1.5px solid var(--tone);
      border-radius: 18px;
      color: var(--color-text-primary);
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
    }
    .selected {
      border: none;
      background: var(--tone);
      color: var(--color-on-accent);
    }
  `,
})
export class ChallengeTabs {
  private readonly wallSquat = inject(ChallengeStore).overview;

  /** The check-off challenges to offer (History also shows finished ones). */
  readonly checkOffs = input.required<readonly CheckOffOverview[]>();
  readonly selectedId = input.required<string | null>();

  protected readonly toneClass = toneClass;

  protected readonly tabs = computed<Tab[]>(() => {
    const wallSquat = this.wallSquat();
    const tabs: Tab[] = wallSquat
      ? [{ id: wallSquat.challenge.id, label: wallSquat.challenge.name, category: 'exercise' }]
      : [];
    for (const { challenge } of this.checkOffs()) {
      const label = challenge.status === 'active' ? challenge.name : `${challenge.name} (finished)`;
      tabs.push({ id: challenge.id, label, category: challenge.category });
    }
    return tabs;
  });
}
