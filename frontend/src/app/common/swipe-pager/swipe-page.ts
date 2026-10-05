import { Directive, ElementRef, inject } from '@angular/core';

/** Marks a direct child of a `swipePager` container as one of its pages. */
@Directive({
  selector: '[swipePage]',
})
export class SwipePage {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
}
