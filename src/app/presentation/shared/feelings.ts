import { Feeling } from '../../domain';

export interface FeelingOption {
  readonly value: Feeling;
  readonly label: string;
}

/** The "How did it feel?" chips, in the order they are shown. */
export const FEELING_OPTIONS: readonly FeelingOption[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'solid', label: 'Solid' },
  { value: 'tough', label: 'Tough' },
];

/** 'solid' → 'Solid'; 'none' → ''. */
export function feelingLabel(feeling: Feeling): string {
  return FEELING_OPTIONS.find((option) => option.value === feeling)?.label ?? '';
}
