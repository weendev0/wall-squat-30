import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  PendingTasks,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChallengeSessions, GetSessionHistoryUseCase } from '../../../application';
import { Attempt, formatDuration } from '../../../domain';
import { DurationPipe } from '../../shared/duration.pipe';
import { shortDateLabel } from '../../shared/date-label';
import { feelingLabel } from '../../shared/feelings';
import { ChallengeStore } from '../../state/challenge-store';

/** Which challenges the list shows. */
export type SessionFilter = 'current' | 'past' | 'all';

interface FilterOption {
  readonly value: SessionFilter;
  readonly label: string;
}

/** Screen 6: every attempt, grouped by challenge and day, with delete (BR-09). */
@Component({
  selector: 'app-sessions-page',
  imports: [DurationPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sessions-page.html',
  styleUrl: './sessions-page.scss',
})
export class SessionsPage implements OnInit {
  private readonly getSessionHistory = inject(GetSessionHistoryUseCase);
  private readonly store = inject(ChallengeStore);
  private readonly pendingTasks = inject(PendingTasks);

  /** The first filter, from the address: /sessions?filter=past */
  readonly filter = input<string>();

  protected readonly filters: readonly FilterOption[] = [
    { value: 'current', label: 'This challenge' },
    { value: 'past', label: 'Past challenges' },
    { value: 'all', label: 'All time' },
  ];
  protected readonly selectedFilter = signal<SessionFilter>('current');
  /** The attempt waiting for "Delete" to be confirmed. */
  protected readonly confirmingDeleteId = signal<string | null>(null);
  protected readonly errorMessage = signal('');

  private readonly history = signal<ChallengeSessions[]>([]);

  /** The challenges the chosen filter shows, newest first. */
  protected readonly visible = computed(() => {
    const history = this.history();
    switch (this.selectedFilter()) {
      case 'current':
        return history.slice(0, 1);
      case 'past':
        return history.filter((sessions) => sessions.challenge.status === 'completed');
      case 'all':
        return history;
    }
  });

  async ngOnInit(): Promise<void> {
    const requested = this.filters.find((option) => option.value === this.filter());
    if (requested) {
      this.selectedFilter.set(requested.value);
    }
    await this.pendingTasks.run(() => this.reload());
  }

  protected heading(sessions: ChallengeSessions): string {
    const { challenge, attemptCount, days, missedDayCount } = sessions;
    const start = shortDateLabel(challenge.startDate);
    return `Started ${start} · target ${formatDuration(challenge.targetSeconds)} · ${attemptCount} ${
      attemptCount === 1 ? 'attempt' : 'attempts'
    } over ${days.length} ${days.length === 1 ? 'day' : 'days'} · ${missedDayCount} missed`;
  }

  protected dayLabel(date: string): string {
    return shortDateLabel(date);
  }

  protected attemptDetails(attempt: Attempt): string {
    const parts = [
      feelingLabel(attempt.feeling),
      attempt.isMakeUp ? `made up on ${shortDateLabel(attempt.recordedOn)}` : '',
      attempt.source === 'manual' ? 'added by hand' : '',
      attempt.note,
    ];
    return parts.filter((part) => part !== '').join(' · ');
  }

  protected async confirmDelete(attemptId: string): Promise<void> {
    this.errorMessage.set('');
    try {
      await this.store.deleteAttempt(attemptId);
      this.confirmingDeleteId.set(null);
      await this.reload();
    } catch {
      this.errorMessage.set('Could not delete. Try again.');
    }
  }

  private async reload(): Promise<void> {
    this.history.set(await this.getSessionHistory.execute());
  }
}
