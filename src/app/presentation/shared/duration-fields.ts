import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

const SECONDS_PER_MINUTE = 60;

/**
 * Two number boxes, Minutes and Seconds, for typing a time.
 * It shows `seconds` and emits the new total in seconds when the user leaves a box.
 * Checking the range is up to the screen that uses it.
 */
@Component({
  selector: 'app-duration-fields',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label>
      <span class="field-label">Minutes</span>
      <input
        #minutesField
        class="text-field"
        type="number"
        inputmode="numeric"
        min="0"
        [value]="minutes()"
        (change)="emitTotal(minutesField.value, secondsField.value)"
      />
    </label>
    <label>
      <span class="field-label">Seconds</span>
      <input
        #secondsField
        class="text-field"
        type="number"
        inputmode="numeric"
        min="0"
        max="59"
        [value]="secondsPart()"
        (change)="emitTotal(minutesField.value, secondsField.value)"
      />
    </label>
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
  `,
})
export class DurationFields {
  readonly seconds = input.required<number>();
  readonly secondsChange = output<number>();

  protected readonly minutes = computed(() => Math.floor(this.seconds() / SECONDS_PER_MINUTE));
  protected readonly secondsPart = computed(() => this.seconds() % SECONDS_PER_MINUTE);

  protected emitTotal(minutesText: string, secondsText: string): void {
    const minutes = Math.max(0, Math.floor(Number(minutesText) || 0));
    const seconds = Math.max(0, Math.floor(Number(secondsText) || 0));
    this.secondsChange.emit(minutes * SECONDS_PER_MINUTE + seconds);
  }
}
