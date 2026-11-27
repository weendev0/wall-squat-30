import { Injectable, signal } from '@angular/core';

/** A hold that was just stopped, waiting for the user to choose Save or Discard (BR-05). */
export interface AttemptDraft {
  readonly durationSeconds: number;
  /** The challenge day the hold was started on. */
  readonly dayNumber: number;
  readonly targetSeconds: number;
}

/** Hands the stopped time from the Timer screen to the Save attempt screen. */
@Injectable({ providedIn: 'root' })
export class AttemptDraftStore {
  private readonly draftState = signal<AttemptDraft | null>(null);

  readonly draft = this.draftState.asReadonly();

  set(draft: AttemptDraft): void {
    this.draftState.set(draft);
  }

  clear(): void {
    this.draftState.set(null);
  }
}
