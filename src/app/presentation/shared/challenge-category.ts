import { ChallengeCategory, CheckOffCategory } from '../../domain';

/** The word shown for each category, e.g. on the coloured pill of a Today card. */
export const CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  exercise: 'Exercise',
  reading: 'Reading',
  course: 'Course',
  study: 'Study',
};

/** The categories offered on New challenge for a daily check-off, in this order. */
export const CHECK_OFF_CATEGORIES: readonly CheckOffCategory[] = ['reading', 'course', 'study'];

/** The CSS class that gives an element the category's colours (see styles.scss). */
export function toneClass(category: ChallengeCategory): string {
  return `tone-${category}`;
}
