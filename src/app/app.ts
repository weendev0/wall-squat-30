import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UpdateBanner } from './presentation/shell/update-banner';
import { ThemeStore } from './presentation/state/theme-store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UpdateBanner],
  template: '<app-update-banner /><router-outlet />',
})
export class App {
  constructor() {
    inject(ThemeStore); // applies the chosen look (cute or dark) as the app starts
  }
}
