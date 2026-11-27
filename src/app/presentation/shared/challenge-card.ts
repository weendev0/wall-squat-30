import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CHALLENGE_LENGTH_DAYS, ChallengeCategory, DayResult } from '../../domain';
import { CATEGORY_LABELS, toneClass } from './challenge-category';

const RECENT_DAY_COUNT = 7;

/**
 * One challenge on Today (canvas board 12): its colour, day, name, a line of detail,
 * the last 7 days, streak and days done. The action button is passed in as content,
 * because a timed challenge starts the timer and a check-off challenge opens Check-in.
 */
@Component({
  selector: 'app-challenge-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card challenge-card" [class]="tone()" [attr.aria-label]="name()">
      <div class="head">
        <div class="info">
          <div class="meta">
            <span class="category-pill">{{ categoryLabel() }}</span>
            <span class="muted small">Day {{ dayNumber() }} of {{ challengeLength }}</span>
          </div>
          <h2 class="name">{{ name() }}</h2>
          <p class="muted small">{{ detail() }}</p>
        </div>
        <ng-content />
      </div>
      <ol class="week" aria-label="Last 7 days">
        @for (day of recentDays(); track day.dayNumber) {
          <li
            [class]="'bar ' + day.status"
            [attr.aria-label]="'Day ' + day.dayNumber + ', ' + day.status"
          ></li>
        }
      </ol>
      <div class="foot muted small">
        <span>Streak {{ streak() }} {{ streak() === 1 ? 'day' : 'days' }}</span>
        <span>{{ daysComplete() }}/{{ challengeLength }} done</span>
      </div>
    </article>
  `,
  styles: `
    .challenge-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      border-top: 4px solid var(--tone);
    }
    .head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .name {
      margin: 0;
      font-size: 19px;
      font-weight: 700;
    }
    .small {
      font-size: 13px;
    }
    .week {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 4px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .bar {
      height: 8px;
      border-radius: 4px;
      background: var(--color-missed);
    }
    .complete {
      background: var(--tone);
    }
    .under-target {
      background: var(--tone-dim);
      box-shadow: inset 0 0 0 1.5px var(--tone);
    }
    .pending {
      background: transparent;
      box-shadow: inset 0 0 0 1.5px var(--tone);
    }
    .foot {
      display: flex;
      justify-content: space-between;
    }
  `,
})
export class ChallengeCard {
  readonly category = input.required<ChallengeCategory>();
  readonly name = input.required<string>();
  readonly dayNumber = input.required<number>();
  readonly detail = input.required<string>();
  readonly days = input.required<readonly DayResult[]>();
  readonly streak = input.required<number>();
  readonly daysComplete = input.required<number>();

  protected readonly challengeLength = CHALLENGE_LENGTH_DAYS;
  protected readonly tone = computed(() => toneClass(this.category()));
  protected readonly categoryLabel = computed(() => CATEGORY_LABELS[this.category()]);

  /** The last 7 challenge days up to today, oldest first. */
  protected readonly recentDays = computed(() => {
    const today = this.dayNumber();
    return this.days().slice(Math.max(0, today - RECENT_DAY_COUNT), today);
  });
}
