import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { tweenedNumber } from '../../tweened-number';

@Component({
  selector: 'app-animated-number',
  imports: [DecimalPipe],
  template: `{{ displayed() | number: digitsInfo() }}`,
})
export class AnimatedNumber {
  readonly value = input.required<number>();

  /** DecimalPipe format, e.g. '1.2-2'. Defaults to the pipe's own '1.0-3'. */
  readonly digitsInfo = input<string>();

  protected readonly displayed = tweenedNumber(this.value);
}
