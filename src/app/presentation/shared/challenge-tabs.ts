import { ChangeDetectionStrategy, Component, computed, inject, input, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CheckOffOverview, TimedOverview } from '../../application';
import { ChallengeStore } from '../state/challenge-store';
import { challengeLook } from './challenge-category';

/** Which challenge Progress or History shows. */
export type ChallengeSelection =
  | { readonly kind: 'timed'; readonly overview: TimedOverview }
  | { readonly kind: 'checkoff'; readonly overview: CheckOffOverview }
  | null;

/**
 * Picks the challenge named by ?challenge=<id>. Without one (or with an unknown id)
 * it falls back to the first timed challenge, then to the first check-off challenge.
 */
export function selectChallenge(
  selectedId: string | undefined,
  timed: readonly TimedOverview[],
  checkOffs: readonly CheckOffOverview[],
): ChallengeSelection {
  const timedMatch = timed.find((overview) => overview.challenge.id === selectedId);
  if (timedMatch) {
    return { kind: 'timed', overview: timedMatch };
  }
  const checkOff = checkOffs.find((overview) => overview.challenge.id === selectedId);
  if (checkOff) {
    return { kind: 'checkoff', overview: checkOff };
  }
  if (timed.length > 0) {
    return { kind: 'timed', overview: timed[0] };
  }
  return checkOffs.length > 0 ? { kind: 'checkoff', overview: checkOffs[0] } : null;
}

/** What Progress and History need to know about the selected challenge. */
export interface SelectedChallenge {
  /** The id of the selected tab, or null when there is no challenge at all. */
  readonly id: Signal<string | null>;
  /** The selected timed challenge, or null when a check-off challenge (or nothing) is selected. */
  readonly timed: Signal<TimedOverview | null>;
  /** The selected check-off challenge, or null when a timed challenge is selected. */
  readonly checkOff: Signal<CheckOffOverview | null>;
  /** The tone class of the selected challenge, so the whole screen takes its colour. */
  readonly tone: Signal<string>;
}

/** Follows ?challenge=<id> and the stores, and works out what Progress or History shows. */
export function selectedChallenge(
  selectedId: Signal<string | undefined>,
  timed: Signal<readonly TimedOverview[]>,
  checkOffs: Signal<readonly CheckOffOverview[]>,
): SelectedChallenge {
  const selection = computed(() => selectChallenge(selectedId(), timed(), checkOffs()));
  return {
    id: computed(() => selection()?.overview.challenge.id ?? null),
    timed: computed(() => {
      const current = selection();
      return current?.kind === 'timed' ? current.overview : null;
    }),
    checkOff: computed(() => {
      const current = selection();
      return current?.kind === 'checkoff' ? current.overview : null;
    }),
    tone: computed(() => toneOf(selection())),
  };
}

/** The tone class of a selection; exercise coral when nothing is selected. */
function toneOf(selection: ChallengeSelection): string {
  if (selection === null) {
    return 'tone-exercise';
  }
  const customCategory = selection.kind === 'checkoff' ? selection.overview.customCategory : null;
  return challengeLook(selection.overview.challenge, customCategory).toneClass;
}

interface Tab {
  readonly id: string;
  readonly label: string;
  readonly toneClass: string;
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
            [class]="tab.toneClass"
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
  private readonly timed = inject(ChallengeStore).active;

  /** The check-off challenges to offer (History also shows finished ones). */
  readonly checkOffs = input.required<readonly CheckOffOverview[]>();
  readonly selectedId = input.required<string | null>();

  protected readonly tabs = computed<Tab[]>(() => {
    const tabs: Tab[] = this.timed().map(({ challenge }) => ({
      id: challenge.id,
      label: challenge.name,
      toneClass: challengeLook(challenge).toneClass,
    }));
    for (const { challenge, customCategory } of this.checkOffs()) {
      const label = challenge.status === 'active' ? challenge.name : `${challenge.name} (finished)`;
      tabs.push({
        id: challenge.id,
        label,
        toneClass: challengeLook(challenge, customCategory).toneClass,
      });
    }
    return tabs;
  });
}
