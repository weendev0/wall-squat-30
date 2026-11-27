import { Pipe, PipeTransform } from '@angular/core';
import { formatDuration } from '../../domain';

/** Shows seconds as m:ss in templates: {{ 74 | duration }} → 1:14. Empty values show a dash. */
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(totalSeconds: number | null | undefined): string {
    return totalSeconds === null || totalSeconds === undefined ? '–' : formatDuration(totalSeconds);
  }
}
