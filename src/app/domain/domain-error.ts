/**
 * Thrown when a business rule is broken, for example a target of 0 seconds.
 * The UI catches it and shows `message` to the user.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
