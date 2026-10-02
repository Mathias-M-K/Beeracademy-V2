import { Component, computed, input } from '@angular/core';

export type TextEffect = 'letters' | 'roll';

@Component({
  selector: 'app-animated-text',
  template: `
    <span class="visually-hidden">{{ text() }}</span>
    @for (item of [current()]; track item.key) {
      <span class="text" aria-hidden="true" animate.leave="text-leave">
        @for (letter of item.letters; track $index) {
          <span class="letter" [style.--i]="$index">{{ letter }}</span>
        }
      </span>
    }
  `,
  styleUrl: './animated-text.scss',
  host: {
    '[class.letters]': "effect() === 'letters'",
    '[class.roll]': "effect() === 'roll'",
    '[style.--delay.ms]': 'delay()',
    '[style.--duration.ms]': 'duration()',
  },
})
export class AnimatedText {
  readonly text = input.required<string>();

  /** Re-animates whenever this changes. Defaults to the text, so set it to animate between equal texts. */
  readonly key = input<unknown>();

  /** letters: old text fades out, new text types in letter by letter. roll: old text rolls up and out, new text rolls up in. */
  readonly effect = input<TextEffect>('letters');

  /** Milliseconds before the animation starts, for staggering several texts. */
  readonly delay = input(0);

  /** Milliseconds the text takes to animate in. Defaults to 340 for letters (per letter) and 460 for roll. */
  readonly duration = input<number>();

  protected readonly current = computed(() => ({
    key: this.key() ?? this.text(),
    letters: this.text().split(''),
  }));
}
