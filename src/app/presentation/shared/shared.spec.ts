import { TestBed } from '@angular/core/testing';
import {
  aCheckOffChallenge,
  aWaterCategory,
  aWaterChallenge,
} from '../../domain/testing/domain-builders';
import { challengeLook } from './challenge-category';
import { shortDateLabel } from './date-label';
import { DurationPipe } from './duration.pipe';
import { ProgressRing } from './progress-ring';
import { singular } from './singular';

describe('DurationPipe', () => {
  const pipe = new DurationPipe();

  it('shows seconds as m:ss and empty values as a dash', () => {
    expect(pipe.transform(74)).toBe('1:14');
    expect(pipe.transform(null)).toBe('–');
    expect(pipe.transform(undefined)).toBe('–');
  });
});

describe('shortDateLabel', () => {
  it('shows a date the way the screens do', () => {
    expect(shortDateLabel('2026-11-27')).toBe('Fri 27 Nov');
  });
});

describe('ProgressRing', () => {
  function dashOffsetFor(progress: number): number {
    const fixture = TestBed.createComponent(ProgressRing);
    fixture.componentRef.setInput('progress', progress);
    fixture.detectChanges();
    const fill = fixture.nativeElement.querySelector('.fill') as SVGCircleElement;
    return Number(fill.getAttribute('stroke-dashoffset'));
  }

  it('is empty at 0, half full at 0.5 and never more than full', () => {
    const empty = dashOffsetFor(0);

    expect(dashOffsetFor(0.5)).toBeCloseTo(empty / 2);
    expect(dashOffsetFor(1.4)).toBe(0);
  });
});

describe('singular', () => {
  it('turns a plain plural into one item', () => {
    expect(singular('glasses')).toBe('glass');
    expect(singular('steps')).toBe('step');
    expect(singular('pages')).toBe('page');
    expect(singular('water')).toBe('water');
    expect(singular('class')).toBe('class');
  });
});

describe('challengeLook', () => {
  it('uses the built-in word and colour, or your own name, colour and icon', () => {
    expect(challengeLook(aCheckOffChallenge())).toEqual({
      label: 'Reading',
      toneClass: 'tone-reading',
      icon: '',
    });
    expect(challengeLook(aWaterChallenge(), aWaterCategory())).toEqual({
      label: 'Water Drinking',
      toneClass: 'tone-sky',
      icon: '💧',
    });
  });
});
