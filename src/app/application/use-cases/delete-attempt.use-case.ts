import { DomainError } from '../../domain';
import { AttemptRepository } from '../ports';

/** BR-09: deletes one attempt. Day status, streak and totals follow automatically. */
export class DeleteAttemptUseCase {
  constructor(private readonly attempts: AttemptRepository) {}

  async execute(attemptId: string): Promise<void> {
    const attempt = await this.attempts.findById(attemptId);
    if (attempt === null) {
      throw new DomainError('That attempt no longer exists.');
    }
    await this.attempts.delete(attemptId);
  }
}
