import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { formatDuration } from '../../../domain';
import { SCREEN_WAKE_LOCK } from '../../../composition/provide-wall-squat';
import { DurationPipe } from '../../shared/duration.pipe';
import { ProgressRing } from '../../shared/progress-ring';
import { AttemptDraftStore } from '../../state/attempt-draft-store';
import { ChallengeStore } from '../../state/challenge-store';
import { challengeIdOf } from '../../state/route-guards';
import { HoldTimer } from '../../timer/hold-timer';

/**
 * Screen 2: the running timer. It keeps the screen on, counts down 3-2-1,
 * then times the hold and keeps counting past the target (BR-09).
 */
@Component({
  selector: 'app-timer-page',
  imports: [DurationPipe, ProgressRing],
  providers: [HoldTimer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timer-page.html',
  styleUrl: './timer-page.scss',
})
export class TimerPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly drafts = inject(AttemptDraftStore);
  private readonly wakeLock = inject(SCREEN_WAKE_LOCK);
  protected readonly timer = inject(HoldTimer);

  // The route guard makes sure /timer/:challengeId is a running challenge with a day today.
  private readonly overview = inject(ChallengeStore).find(
    challengeIdOf(inject(ActivatedRoute).snapshot),
  )!;
  protected readonly dayNumber = this.overview.todayDayNumber!;
  protected readonly targetSeconds = this.overview.challenge.targetSeconds;
  protected readonly challengeName = this.overview.challenge.name;

  protected readonly ringProgress = computed(
    () => this.timer.elapsedSeconds() / this.targetSeconds,
  );

  protected readonly targetMessage = computed(() => {
    const elapsed = this.timer.elapsedSeconds();
    if (elapsed < this.targetSeconds) {
      return `${this.targetSeconds - elapsed}s to target`;
    }
    const over = elapsed - this.targetSeconds;
    return over === 0 ? 'Target reached!' : `Target reached · +${formatDuration(over)}`;
  });

  ngOnInit(): void {
    void this.wakeLock.acquire();
    this.timer.start(this.targetSeconds);
  }

  ngOnDestroy(): void {
    void this.wakeLock.release();
  }

  protected stop(): void {
    const durationSeconds = this.timer.stop();
    this.drafts.set({
      challengeId: this.overview.challenge.id,
      durationSeconds,
      dayNumber: this.dayNumber,
      targetSeconds: this.targetSeconds,
    });
    void this.router.navigate(['/save-attempt']);
  }

  protected cancel(): void {
    void this.router.navigate(['/today']);
  }
}
