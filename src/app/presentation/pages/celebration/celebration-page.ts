import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CHALLENGE_LENGTH_DAYS } from '../../../domain';
import { DurationPipe } from '../../shared/duration.pipe';
import { ChallengeStore } from '../../state/challenge-store';
import { CheckOffStore } from '../../state/check-off-store';
import { challengeIdOf } from '../../state/route-guards';

/** A confetti piece: where it sits and how it looks. Fixed, so the screen looks the same every time. */
interface ConfettiPiece {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly rotation: number;
  readonly color: string;
}

const CONFETTI_COLORS = ['#E4572E', '#FFB39C', '#F5F4F0', '#FF8A66'];
const CONFETTI_COUNT = 24;

/**
 * Screen 11: shown once after day 30, with the final numbers of the challenge:
 * timed (BR-10) or Reading, Course or Study (BR-18).
 */
@Component({
  selector: 'app-celebration-page',
  imports: [DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './celebration-page.html',
  styleUrl: './celebration-page.scss',
})
export class CelebrationPage {
  private readonly store = inject(ChallengeStore);
  private readonly checkOffStore = inject(CheckOffStore);
  private readonly router = inject(Router);

  /** From /celebration/:challengeId. */
  readonly challengeId = input.required<string>();

  // The route guard makes sure a finished challenge is waiting for its celebration.
  // Kept as it was on arrival, so the numbers stay on screen while the buttons save.
  protected readonly timed = this.store.find(challengeIdOf(inject(ActivatedRoute).snapshot));
  protected readonly checkOff = computed(() =>
    this.timed ? null : this.checkOffStore.find(this.challengeId()),
  );
  protected readonly challengeLength = CHALLENGE_LENGTH_DAYS;
  protected readonly confetti: readonly ConfettiPiece[] = Array.from(
    { length: CONFETTI_COUNT },
    (_, index) => ({
      left: (index * 53 + 17) % 100,
      top: (index * 37 + 11) % 40,
      width: index % 3 === 0 ? 6 : 10,
      rotation: (index * 47) % 180,
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    }),
  );

  protected async startNewChallenge(): Promise<void> {
    await this.markShown();
    await this.router.navigate(['/new-challenge']);
  }

  protected async viewInHistory(): Promise<void> {
    await this.markShown();
    const checkOff = this.checkOff();
    if (checkOff) {
      await this.router.navigate(['/history'], {
        queryParams: { challenge: checkOff.challenge.id },
      });
    } else {
      await this.router.navigate(['/sessions'], { queryParams: { filter: 'past' } });
    }
  }

  private async markShown(): Promise<void> {
    const checkOff = this.checkOff();
    if (checkOff) {
      await this.checkOffStore.markCelebrationShown(checkOff.challenge.id);
    } else {
      await this.store.markCelebrationShown(this.challengeId());
    }
  }
}
