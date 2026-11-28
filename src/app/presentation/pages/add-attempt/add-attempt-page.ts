import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DayResult, DomainError, Feeling, formatDuration } from '../../../domain';
import { DurationFields } from '../../shared/duration-fields';
import { shortDateLabel } from '../../shared/date-label';
import { FEELING_OPTIONS } from '../../shared/feelings';
import { ChallengeStore } from '../../state/challenge-store';
import { challengeIdOf } from '../../state/route-guards';

/** One choice in the "Which day" list. */
interface DayOption {
  readonly dayNumber: number;
  readonly title: string;
  readonly subtitle: string;
}

const DEFAULT_MANUAL_SECONDS = 60;

/**
 * Screen 10: add an attempt typed in by hand (BR-08), for today or an earlier day.
 * An earlier day counts as a make-up: it counts toward the 30 days, not the streak (BR-07).
 */
@Component({
  selector: 'app-add-attempt-page',
  imports: [DurationFields],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-attempt-page.html',
  styleUrl: './add-attempt-page.scss',
})
export class AddAttemptPage implements OnInit {
  private readonly store = inject(ChallengeStore);
  private readonly router = inject(Router);

  /** The day to preselect, from the address: /add-attempt/:challengeId?day=4 */
  readonly day = input<string>();

  // The route guard makes sure /add-attempt/:challengeId is running with a day today.
  private readonly overview = this.store.find(challengeIdOf(inject(ActivatedRoute).snapshot))!;
  protected readonly challengeName = this.overview.challenge.name;
  private readonly todayNumber = this.overview.todayDayNumber!;

  protected readonly feelings = FEELING_OPTIONS;
  /** Today first, then each earlier day of the challenge. */
  protected readonly dayOptions: readonly DayOption[] = this.overview.days
    .slice(0, this.todayNumber)
    .reverse()
    .map((day) => toOption(day, this.todayNumber));
  protected readonly selectedDay = signal(this.todayNumber);
  protected readonly durationSeconds = signal(DEFAULT_MANUAL_SECONDS);
  protected readonly feeling = signal<Feeling>('none');
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');

  ngOnInit(): void {
    const requested = Number(this.day());
    const isOffered = this.dayOptions.some((option) => option.dayNumber === requested);
    if (isOffered) {
      this.selectedDay.set(requested);
    }
  }

  protected toggleFeeling(value: Feeling): void {
    this.feeling.update((current) => (current === value ? 'none' : value));
  }

  protected async save(): Promise<void> {
    this.isSaving.set(true);
    this.errorMessage.set('');
    try {
      await this.store.record({
        challengeId: this.overview.challenge.id,
        durationSeconds: this.durationSeconds(),
        source: 'manual',
        dayNumber: this.selectedDay(),
        feeling: this.feeling(),
      });
      await this.backToProgress();
    } catch (error) {
      this.errorMessage.set(
        error instanceof DomainError ? error.message : 'Could not save. Try again.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  protected cancel(): void {
    void this.backToProgress();
  }

  /** Back to Progress, on this challenge's tab. */
  private async backToProgress(): Promise<void> {
    await this.router.navigate(['/progress'], {
      queryParams: { challenge: this.overview.challenge.id },
    });
  }
}

function toOption(day: DayResult, todayNumber: number): DayOption {
  const isToday = day.dayNumber === todayNumber;
  const title = `Day ${day.dayNumber} · ${isToday ? 'Today' : shortDateLabel(day.date)}`;
  const best = day.bestSeconds === null ? '' : formatDuration(day.bestSeconds);

  let subtitle: string;
  if (isToday) {
    subtitle = best ? `Best so far ${best}` : 'Nothing saved yet';
  } else if (day.status === 'missed') {
    subtitle = 'Missed, will count as make-up';
  } else if (day.status === 'under-target') {
    subtitle = `Under target (${best}), will count as make-up`;
  } else {
    subtitle = `Best ${best}`;
  }
  return { dayNumber: day.dayNumber, title, subtitle };
}
