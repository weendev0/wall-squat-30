import {
  BUILT_IN_CHECK_OFF_CATEGORIES,
  BUILT_IN_CHECK_OFF_NAMES,
  BuiltInCheckOffCategory,
  Challenge,
  CustomCheckOffCategory,
} from '../../domain';

/** How a category looks on screen: its word, its colour and an optional icon. */
export interface CategoryLook {
  /** For example "Reading" or "Water Drinking", shown on the coloured pill. */
  readonly label: string;
  /** The CSS class that gives an element the category's colours (see styles.scss). */
  readonly toneClass: string;
  /** BR-21: an emoji for the user's own categories. Empty for built-in ones. */
  readonly icon: string;
}

/** The categories that come with the app: timed exercise, and Reading, Course and Study. */
export type BuiltInCategory = 'exercise' | BuiltInCheckOffCategory;

/** The built-in check-off categories offered on New challenge, in this order. */
export const CHECK_OFF_CATEGORIES = BUILT_IN_CHECK_OFF_CATEGORIES;

/** Course and Study share the mint colour; every other category has its own. */
export function builtInLook(category: BuiltInCategory): CategoryLook {
  const label = category === 'exercise' ? 'Exercise' : BUILT_IN_CHECK_OFF_NAMES[category];
  return { label, toneClass: `tone-${category}`, icon: '' };
}

/** BR-21: a category of the user's own, in the colour and icon they picked. */
export function customLook(category: CustomCheckOffCategory): CategoryLook {
  return { label: category.name, toneClass: `tone-${category.tone}`, icon: category.icon };
}

/** Used if a challenge's own category cannot be found; deleting a used one is refused (BR-24). */
const UNKNOWN_CUSTOM_LOOK: CategoryLook = { label: 'Daily', toneClass: 'tone-study', icon: '' };

/** The look of any challenge. Pass the user's own category when the challenge has one. */
export function challengeLook(
  challenge: Challenge,
  customCategory: CustomCheckOffCategory | null = null,
): CategoryLook {
  if (challenge.category !== 'custom') {
    return builtInLook(challenge.category);
  }
  return customCategory ? customLook(customCategory) : UNKNOWN_CUSTOM_LOOK;
}
