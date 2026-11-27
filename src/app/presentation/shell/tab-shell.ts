import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface Tab {
  readonly label: string;
  readonly path: string;
  /** SVG path data of the 24×24 tab icon. */
  readonly icon: string;
}

/** The three main screens, with the tab bar at the bottom (spec section 3). */
@Component({
  selector: 'app-tab-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tab-shell.html',
  styleUrl: './tab-shell.scss',
})
export class TabShell {
  protected readonly tabs: readonly Tab[] = [
    { label: 'Today', path: '/today', icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2' },
    {
      label: 'Progress',
      path: '/progress',
      icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    },
    { label: 'History', path: '/history', icon: 'M5 20V10M12 20V4M19 20v-7' },
  ];
}
