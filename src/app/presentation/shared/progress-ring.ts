import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A circle that fills up from 0 to 1. The content inside it is projected (ng-content). */
@Component({
  selector: 'app-progress-ring',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle class="track" cx="50" cy="50" [attr.r]="radius" />
      <circle
        class="fill"
        cx="50"
        cy="50"
        [attr.r]="radius"
        [attr.stroke-dasharray]="circumference"
        [attr.stroke-dashoffset]="dashOffset()"
      />
    </svg>
    <div class="content"><ng-content /></div>
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      aspect-ratio: 1;
    }
    svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }
    circle {
      fill: none;
      stroke-width: 6;
    }
    .track {
      stroke: var(--color-border);
    }
    .fill {
      stroke: var(--color-accent);
      stroke-linecap: round;
      transition: stroke-dashoffset 0.25s linear;
    }
    .content {
      position: absolute;
      inset: 0;
      display: grid;
      place-content: center;
      text-align: center;
    }
  `,
})
export class ProgressRing {
  /** How full the ring is, from 0 (empty) to 1 (full). Values outside are clamped. */
  readonly progress = input.required<number>();

  protected readonly radius = RADIUS;
  protected readonly circumference = CIRCUMFERENCE;
  protected readonly dashOffset = computed(
    () => CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, this.progress()))),
  );
}
