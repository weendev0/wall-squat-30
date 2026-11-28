/**
 * The unit for one item, for the "+1 glass" button: "glasses" → "glass", "steps" → "step".
 * A word without a plain English plural, such as "water", stays as it is.
 */
export function singular(unit: string): string {
  if (/(ss|sh|ch|x)es$/i.test(unit)) {
    return unit.slice(0, -2);
  }
  if (/[^s]s$/i.test(unit)) {
    return unit.slice(0, -1);
  }
  return unit;
}
