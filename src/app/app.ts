import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UpdateBanner } from './presentation/shell/update-banner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UpdateBanner],
  template: '<app-update-banner /><router-outlet />',
})
export class App {}
