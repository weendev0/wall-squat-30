/**
 * The fixed numbers of the challenge, in one place (no magic numbers in the code).
 * Each constant names the business rule (BR-xx in the functional spec) it belongs to.
 */

/** BR-01: a challenge always lasts this many calendar days. */
export const CHALLENGE_LENGTH_DAYS = 30;

/** BR-02: the daily target when the user does not choose another one. */
export const DEFAULT_TARGET_SECONDS = 60;

/** BR-02: the shortest and longest daily target the user can pick. */
export const MIN_TARGET_SECONDS = 5;
export const MAX_TARGET_SECONDS = 600;

/** BR-05: attempts shorter than this are thrown away without asking. */
export const MIN_ATTEMPT_SECONDS = 5;

/** BR-08: a manual attempt cannot be longer than this (a sanity limit for typos). */
export const MAX_ATTEMPT_SECONDS = 3600;
