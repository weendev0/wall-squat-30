import { TestBed } from '@angular/core/testing';
import { DurationFields } from './duration-fields';

describe('DurationFields', () => {
  it('shows a time as minutes and seconds and reports the typed total', () => {
    const fixture = TestBed.createComponent(DurationFields);
    fixture.componentRef.setInput('seconds', 75);
    fixture.detectChanges();
    const emitted: number[] = [];
    fixture.componentInstance.secondsChange.subscribe((total) => emitted.push(total));

    const [minutes, seconds] = fixture.nativeElement.querySelectorAll('input');
    expect([minutes.value, seconds.value]).toEqual(['1', '15']);

    minutes.value = '2';
    seconds.value = 'abc';
    seconds.dispatchEvent(new Event('change'));

    expect(emitted).toEqual([120]);
  });
});
