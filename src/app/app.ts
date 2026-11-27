import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Root component: shows whichever screen the router picks (see app.routes.ts). */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
