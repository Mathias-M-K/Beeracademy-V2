import { Component, computed, input } from '@angular/core';
import { Suit } from '../../../../api-models/model/suit';

const SUIT_PATHS: Record<Suit, readonly string[]> = {
  DIAMOND: ['M12 1.6 L21.4 12 L12 22.4 L2.6 12 Z'],
  HEART: [
    'M12 21.3C12 21.3 2.4 15.1 2.4 8.9 2.4 5.6 5 3.2 8.1 3.2c1.9 0 3.2 1 3.9 2 .7-1 2-2 3.9-2 3.1 0 5.7 2.4 5.7 5.7 0 6.2-9.6 12.4-9.6 12.4Z',
  ],
  SPADE: [
    'M12 2.4S3.6 8.6 3.6 13.6c0 2.7 2 4.6 4.4 4.6 1.3 0 2.4-.6 3.1-1.5-.1 1.9-.8 3.5-2.3 4.9h6.4c-1.5-1.4-2.2-3-2.3-4.9.7.9 1.8 1.5 3.1 1.5 2.4 0 4.4-1.9 4.4-4.6C20.4 8.6 12 2.4 12 2.4Z',
  ],
  CLUB: [
    'M10.6 12.8c0 4.2-.6 7-2 8.8h6.8c-1.4-1.8-2-4.6-2-8.8Z',
    'M12 3.1a4.3 4.3 0 1 1 0 8.6 4.3 4.3 0 0 1 0-8.6Z',
    'M7.2 9.1a4.3 4.3 0 1 1 0 8.6 4.3 4.3 0 0 1 0-8.6Z',
    'M16.8 9.1a4.3 4.3 0 1 1 0 8.6 4.3 4.3 0 0 1 0-8.6Z',
  ],
  SQUARE: ['M5.8 3.4h12.4a2.4 2.4 0 0 1 2.4 2.4v12.4a2.4 2.4 0 0 1-2.4 2.4H5.8a2.4 2.4 0 0 1-2.4-2.4V5.8a2.4 2.4 0 0 1 2.4-2.4Z'],
  HEXAGON: ['M12 1.8 21 7v10l-9 5.2L3 17V7Z'],
  STAR: ['M12 2l2.59 6.44L21.51 8.91 16.18 13.36 17.88 20.09 12 16.4 6.12 20.09 7.82 13.36 2.49 8.91 9.41 8.44Z'],
  CIRCLE: ['M12 2.4a9.6 9.6 0 1 1 0 19.2 9.6 9.6 0 0 1 0-19.2Z'],
  TRIANGLE: ['M12 2.6 22 20.4H2Z'],
  SEMICIRCLE: ['M2.6 16.2a9.4 9.4 0 0 1 18.8 0Z'],
  MOON: ['M15.2 2.6a9.6 9.6 0 1 0 0 18.8 11.5 11.5 0 0 1 0-18.8Z'],
  THUMBS_UP: [
    'M4.6 11.6A1.6 1.6 0 0 1 6.2 10h2.4v11.4H6.2a1.6 1.6 0 0 1-1.6-1.6Z',
    'M10.2 10.6 13.4 3.4a1 1 0 0 1 1-.6 2.1 2.1 0 0 1 2 2.4l-.6 3.4h3.6a2 2 0 0 1 2 2.4l-1.3 7.6a2.6 2.6 0 0 1-2.6 2.2h-7.3Z',
  ],
};

@Component({
  selector: 'suit-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.aria-hidden]="label() ? null : 'true'"
      [attr.aria-label]="label() || null"
      [attr.role]="label() ? 'img' : null"
    >
      @for (d of paths(); track d) {
        <path [attr.d]="d" fill="currentColor" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }

    svg {
      display: block;
    }
  `,
})
export class SuitIcon {
  /** Which suit to draw. One per player in the expanded deck. */
  readonly suit = input.required<Suit>();

  /** Edge length in pixels of the square icon box. */
  readonly size = input(16);

  /**
   * Accessible label. When set, the icon is exposed to assistive tech.
   * When omitted, the icon is treated as decorative (aria-hidden).
   */
  readonly label = input<string>();

  protected readonly paths = computed(() => SUIT_PATHS[this.suit()]);
}
