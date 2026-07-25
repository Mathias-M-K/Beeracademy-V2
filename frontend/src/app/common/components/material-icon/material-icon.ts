import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'material-icon',
  template: `
    <span
      class="material-symbols-outlined"
      [style.font-size.px]="size()"
      [style.font-variation-settings]="variationSettings()"
      [attr.aria-hidden]="label() ? null : 'true'"
      [attr.aria-label]="label() || null"
      [attr.role]="label() ? 'img' : null"
    >{{ icon() }}</span>
  `,
  styleUrl: './material-icon.scss',
})
export class MaterialIcon {
  /** Material Symbol name, e.g. "settings", "delete". */
  readonly icon = input.required<string>();

  /** Icon size in pixels. Defaults to inheriting the surrounding font size. */
  readonly size = input<number>();

  /** Whether the icon is filled (0 = outlined, 1 = filled). */
  readonly fill = input(false);

  /** Font weight of the icon stroke (100–700). */
  readonly weight = input(400);

  /**
   * Accessible label. When set, the icon is exposed to assistive tech.
   * When omitted, the icon is treated as decorative (aria-hidden).
   */
  readonly label = input<string>();

  protected readonly variationSettings = computed(
    () => `'FILL' ${this.fill() ? 1 : 0}, 'wght' ${this.weight()}`,
  );
}
