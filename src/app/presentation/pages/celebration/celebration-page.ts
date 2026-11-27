import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CHALLENGE_LENGTH_DAYS } from '../../../domain';
import { DurationPipe } from '../../shared/duration.pipe';
import { ChallengeStore } from '../../state/challenge-store';

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

/** Screen 11: shown once after day 30 (BR-10), with the final numbers of the challenge. */
@Component({
  selector: 'app-celebration-page',
  imports: [DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './celebration-page.html',
  styleUrl: './celebration-page.scss',
})
export class CelebrationPage {
  private readonly store = inject(ChallengeStore);
  private readonly router = inject(Router);

  // The route guard makes sure a finished challenge is waiting for its celebration.
  protected readonly overview = this.store.overview()!;
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
    await this.store.markCelebrationShown();
    await this.router.navigate(['/new-challenge']);
  }

  protected async viewInHistory(): Promise<void> {
    await this.store.markCelebrationShown();
    await this.router.navigate(['/sessions'], { queryParams: { filter: 'past' } });
  }
}
