import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  PendingTasks,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ExportHistoryCsvUseCase } from '../../../application';
import { CLOCK, FILE_SHARER } from '../../../composition/provide-wall-squat';
import { ChallengeStore } from '../../state/challenge-store';
import { Theme, ThemeStore } from '../../state/theme-store';

const CSV_MIME_TYPE = 'text/csv';

/** The two looks the user can pick (spec section 13). */
const LOOKS: readonly { theme: Theme; label: string }[] = [
  { theme: 'cute', label: 'Cute' },
  { theme: 'dark', label: 'Dark' },
];

/** Screen 7: the look, the CSV backup and Reset all history (BR-11). */
@Component({
  selector: 'app-settings-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage implements OnInit {
  private readonly exportCsv = inject(ExportHistoryCsvUseCase);
  private readonly fileSharer = inject(FILE_SHARER);
  private readonly clock = inject(CLOCK);
  private readonly store = inject(ChallengeStore);
  private readonly router = inject(Router);
  private readonly pendingTasks = inject(PendingTasks);

  /**
   * The CSV is prepared when the screen opens, so the Export tap can open the share
   * sheet straight away: iOS refuses to share when the tap first waits for the database.
   */
  private readonly csv = signal<string | null>(null);

  protected readonly themeStore = inject(ThemeStore);
  protected readonly looks = LOOKS;

  protected readonly isConfirmingReset = signal(false);
  protected readonly message = signal('');

  async ngOnInit(): Promise<void> {
    // PendingTasks tells Angular the screen is still loading (tests wait for it).
    await this.pendingTasks.run(async () => this.csv.set(await this.exportCsv.execute()));
  }

  protected async exportHistory(): Promise<void> {
    const csv = this.csv();
    if (csv === null) {
      return; // still preparing; the screen opened a moment ago
    }
    try {
      const fileName = `30-days-challenges-${this.clock.today()}.csv`;
      const outcome = await this.fileSharer.shareText(fileName, csv, CSV_MIME_TYPE);
      this.message.set(outcome === 'cancelled' ? '' : 'History exported.');
    } catch {
      this.message.set('Could not export. Try again.');
    }
  }

  protected async reset(): Promise<void> {
    await this.store.resetHistory();
    this.isConfirmingReset.set(false);
    await this.router.navigate(['/today']);
  }
}
