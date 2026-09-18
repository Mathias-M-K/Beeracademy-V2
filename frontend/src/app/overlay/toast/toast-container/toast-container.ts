import {
  afterNextRender,
  ApplicationRef,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChildren,
} from '@angular/core';
import { ToastService } from '../../../services/toast/toast.service';
import { Toast } from '../toast/toast';

/** Pointer travel before a gesture commits to an axis. A thumb is far less steady than a mouse. */
const AXIS_LOCK_PX = 6;
const TOUCH_AXIS_LOCK_PX = 14;

/**
 * Travel that makes a gesture a real drag rather than a shaky tap. Below this the trailing click
 * is left alone, so a tap that wobbled still opens the toast instead of being swallowed.
 */
const DRAG_INTENT_PX = 18;

/** Travel that flings a toast away instead of springing it back. */
const DISMISS_PX = 90;

/** Upward travel that commits to opening the overview, and the spring's characteristic length. */
const EXPAND_PX = 56;

/** How far a dismissed toast keeps travelling once it is let go. */
const EXIT_TRAVEL_PX = 420;

/** A toast taller than this has outgrown being a toast; past here the message clips. */
const MAX_EXPANDED_LINES = 4;

type GestureAxis = 'undecided' | 'horizontal' | 'vertical';

/** Where a toast stood when it was dismissed, and where it is headed. */
interface ExitPlan {
  depth: number;
  x: number;
  y: number;
  rotate: number;
}

interface Gesture {
  pointerId: number;
  pointerType: string;

  /** The toast the gesture may drag — only the reachable one. */
  toastId: string | null;
  element: HTMLElement | null;

  startX: number;
  startY: number;
  axis: GestureAxis;
  dx: number;
  dy: number;
}

@Component({
  selector: 'app-toast-container',
  imports: [Toast],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss',
  host: {
    '[class.toast-overview]': 'isInOverviewMode()',
    '[style.--toast-count]': 'activeCount()',
    '[class.is-exiting]': 'isExiting()',
    '[class.is-resizing]': 'isResizing()',
    '[class.is-clearing]': 'isClearing()',
    '[class.has-expanded]': 'expandedToastId() !== null',
    '[style.--expanded-lines]': 'expandedLines()',
    '(document:keydown.escape)': 'collapse()',
  },
})
export class ToastContainer {
  private readonly toastService = inject(ToastService);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly appRef = inject(ApplicationRef);
  private readonly toastElements = viewChildren('toastElement', { read: ElementRef<HTMLElement> });

  protected readonly toasts = this.toastService.toasts;

  protected readonly isInOverviewMode = signal<boolean>(false);

  /** Toasts playing their exit, held at the depth they had when dismissed. */
  private readonly leaving = signal<ReadonlyMap<string, ExitPlan>>(new Map());

  protected readonly stack = computed(() => {
    const leaving = this.leaving();
    const all = this.toasts();
    const active = all.filter((toast) => !leaving.has(toast.id));
    const depthById = new Map(active.map((toast, index) => [toast.id, active.length - 1 - index]));

    return all.map((toast) => {
      const exit = leaving.get(toast.id);

      return {
        data: toast,
        isLeaving: exit !== undefined,
        depth: exit?.depth ?? depthById.get(toast.id) ?? 0,
        exitX: `${exit?.x ?? 0}px`,
        exitY: `${exit?.y ?? 0}px`,
        exitRotate: `${exit?.rotate ?? 0}deg`,
      };
    });
  });

  /** Rows that still count for layout — an exiting row has already given up its slot. */
  protected readonly activeCount = computed(
    () => this.stack().filter((entry) => !entry.isLeaving).length,
  );

  protected readonly isExiting = computed(() => this.stack().some((entry) => entry.isLeaving));

  /** True while the list is resizing, so the transient overflow never shows a scrollbar. */
  protected readonly isResizing = signal<boolean>(false);

  /** True while the whole list is being emptied, which is the one time exits cascade. */
  protected readonly isClearing = signal<boolean>(false);

  /** The stacked toast a tap has opened up to its full content, if any. */
  protected readonly expandedToastId = signal<string | null>(null);

  /** How many lines that toast's message needs — 1 or 2 — which sets the opened height. */
  protected readonly expandedLines = signal<number>(1);

  private gesture: Gesture | null = null;

  /**
   * The element a finished drag belongs to. The click the browser fires afterwards must not
   * also read as a tap on it — but a click anywhere else is none of our business.
   */
  private suppressClickOn: HTMLElement | null = null;

  constructor() {
    const element = this.host.nativeElement;

    element.addEventListener('pointerdown', this.onPointerDown);
    element.addEventListener('click', this.onClickCapture, { capture: true });

    inject(DestroyRef).onDestroy(() => this.releasePointer());
  }

  protected onRowsSettled(event: TransitionEvent) {
    if (event.target === event.currentTarget && event.propertyName === 'height') {
      this.isResizing.set(false);
    }
  }

  /**
   * In the deck a tap opens the toast up to its full content and freezes its countdown, and a
   * second tap puts it back. In the overview the content is already all there, so a tap dismisses.
   */
  protected onToastTap(toastId: string) {
    if (this.isInOverviewMode()) {
      this.dismiss(toastId);
      return;
    }

    if (this.expandedToastId() === toastId) {
      this.expandedToastId.set(null);
      return;
    }

    this.expandedLines.set(this.messageLineCount(toastId));
    this.expandedToastId.set(toastId);
  }

  /**
   * How tall the opened card has to be. The card keeps its width when it opens, so the message
   * can be measured in place — but at the opened type scale, which is smaller than the pill's.
   * The styles are read off the host rather than repeated here, so there is one source of truth.
   */
  private messageLineCount(toastId: string): number {
    const message = this.toastElementFor(toastId)?.querySelector<HTMLElement>('.message');
    if (!message) {
      return 1;
    }

    const hostStyle = getComputedStyle(this.host.nativeElement);
    const lineHeight =
      Number.parseFloat(hostStyle.getPropertyValue('--expanded-line-height')) || 17;
    const fontSize = hostStyle.getPropertyValue('--expanded-font-size').trim() || '13px';

    const restore = message.style.cssText;
    message.style.whiteSpace = 'normal';
    message.style.display = 'block';
    message.style.fontSize = fontSize;
    message.style.lineHeight = `${lineHeight}px`;
    message.style.setProperty('-webkit-line-clamp', 'none');

    const lines = Math.round(message.scrollHeight / lineHeight);

    message.style.cssText = restore;

    return Math.min(Math.max(lines, 1), MAX_EXPANDED_LINES);
  }

  protected dismiss(toastId: string, exit?: Omit<ExitPlan, 'depth'>) {
    if (this.leaving().has(toastId)) {
      return;
    }

    if (this.expandedToastId() === toastId) {
      this.expandedToastId.set(null);
    }

    const depth = this.stack().find((entry) => entry.data.id === toastId)?.depth ?? 0;
    const plan: ExitPlan = { depth, ...(exit ?? this.defaultExit()) };

    this.leaving.update((current) => new Map(current).set(toastId, plan));

    afterNextRender(() => void this.removeWhenExitFinishes(toastId), { injector: this.injector });
  }

  /** Stacked toasts drop out of the deck; overview rows slide squarely off the side of the list. */
  private defaultExit(): Omit<ExitPlan, 'depth'> {
    return this.isInOverviewMode()
      ? { x: EXIT_TRAVEL_PX, y: 0, rotate: 0 }
      : { x: 0, y: 260, rotate: 0 };
  }

  private toastElementFor(toastId: string): HTMLElement | undefined {
    return this.toastElements()
      .map((reference) => reference.nativeElement)
      .find((candidate) => candidate.dataset['toastId'] === toastId);
  }

  private async removeWhenExitFinishes(toastId: string) {
    const element = this.toastElementFor(toastId);

    const exits: Animation[] = element?.getAnimations?.() ?? [];
    await Promise.allSettled(exits.map((animation) => animation.finished));
    this.toastService.removeToast(toastId);
    this.leaving.update((current) => {
      const next = new Map(current);
      next.delete(toastId);
      return next;
    });

    if (this.leaving().size === 0) {
      this.isClearing.set(false);
    }
  }

  protected clearAll() {
    this.isClearing.set(true);

    for (const entry of this.stack()) {
      this.dismiss(entry.data.id, { x: EXIT_TRAVEL_PX, y: 0, rotate: 0 });
    }
  }

  protected collapse() {
    if (!this.isInOverviewMode()) {
      return;
    }

    this.isResizing.set(true);
    this.isInOverviewMode.set(false);
  }

  protected expand() {
    if (this.isInOverviewMode()) {
      return;
    }

    // The overview shows every toast in full, so an individually opened one has nothing left to add.
    this.expandedToastId.set(null);

    this.isResizing.set(true);
    this.isInOverviewMode.set(true);
  }

  protected onExpand(event: MouseEvent) {
    this.expand();
    event.stopImmediatePropagation();
  }

  /* ---- direct manipulation ------------------------------------------------ */

  private readonly onPointerDown = (event: PointerEvent) => {
    this.suppressClickOn = null;

    if (this.gesture || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest('.overview-header')) {
      return;
    }

    const element = target?.closest<HTMLElement>('app-toast') ?? null;
    const toastId = this.draggableToastId(element?.dataset['toastId']);

    this.gesture = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      toastId: toastId,
      element: toastId ? element : null,
      startX: event.clientX,
      startY: event.clientY,
      axis: 'undecided',
      dx: 0,
      dy: 0,
    };

    // Passive: panning is already ruled out by touch-action, so nothing here calls
    // preventDefault. Doing so would also suppress the click the browser fires afterwards.
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerup', this.onPointerEnd);
    window.addEventListener('pointercancel', this.onPointerEnd);
  };

  /** Only the toast a finger can actually reach may be dragged. */
  private draggableToastId(toastId: string | undefined): string | null {
    if (!toastId || this.leaving().has(toastId)) {
      return null;
    }

    if (this.isInOverviewMode()) {
      return toastId;
    }

    const front = this.stack().find((entry) => !entry.isLeaving && entry.depth === 0);
    return front?.data.id === toastId ? toastId : null;
  }

  private readonly onPointerMove = (event: PointerEvent) => {
    const gesture = this.gesture;
    if (event.pointerId !== gesture?.pointerId) {
      return;
    }

    gesture.dx = event.clientX - gesture.startX;
    gesture.dy = event.clientY - gesture.startY;

    if (gesture.axis === 'undecided' && !this.lockAxis(gesture)) {
      return;
    }

    if (gesture.axis === 'horizontal') {
      if (gesture.element) {
        this.paintDrag(gesture.element, gesture.dx, 0);
      }
      return;
    }

    this.paintVertical(gesture);
  };

  /**
   * Nothing is committed until the finger has travelled far enough to mean it. Returns whether an
   * axis was claimed, so a move that is still inside the slop paints nothing.
   */
  private lockAxis(gesture: Gesture): boolean {
    const slop = gesture.pointerType === 'touch' ? TOUCH_AXIS_LOCK_PX : AXIS_LOCK_PX;
    if (Math.abs(gesture.dx) < slop && Math.abs(gesture.dy) < slop) {
      return false;
    }

    gesture.axis = Math.abs(gesture.dx) > Math.abs(gesture.dy) ? 'horizontal' : 'vertical';
    gesture.element?.classList.add('is-dragging');

    if (gesture.axis === 'vertical' && gesture.dy < 0 && !this.isInOverviewMode()) {
      this.host.nativeElement.classList.add('is-fanning');
    }

    return true;
  }

  /** Up stretches the deck apart; down hauls the front card out of it. */
  private paintVertical(gesture: Gesture) {
    // Vertical in the overview belongs to the scroller, not to us.
    if (this.isInOverviewMode()) {
      return;
    }

    if (gesture.dy < 0) {
      this.paintFan(-gesture.dy);
      return;
    }

    if (gesture.element) {
      this.paintDrag(gesture.element, 0, gesture.dy);
    }
  }

  private readonly onPointerEnd = (event: PointerEvent) => {
    const gesture = this.gesture;
    if (event.pointerId !== gesture?.pointerId) {
      return;
    }

    const wasCancelled = event.type === 'pointercancel';
    this.releasePointer();

    if (gesture.axis === 'undecided') {
      // Never moved — let it land as an ordinary tap.
      return;
    }

    // A cancel is not a decision, and a wobble is not a drag — in both cases the click that
    // follows is an honest tap and must be left alone.
    const travelled = Math.max(Math.abs(gesture.dx), Math.abs(gesture.dy));
    const wasDrag = !wasCancelled && travelled >= DRAG_INTENT_PX;
    this.suppressClickOn = wasDrag ? (gesture.element ?? this.host.nativeElement) : null;

    if (wasCancelled) {
      this.revert(gesture);
    } else if (gesture.axis === 'horizontal') {
      this.settleHorizontal(gesture);
    } else {
      this.settleVertical(gesture);
    }

    this.appRef.tick();
  };

  /** The gesture was taken away mid-flight — put everything back rather than act on it. */
  private revert(gesture: Gesture) {
    if (gesture.element) {
      this.springBack(gesture.element);
    }

    this.unfan();
  }

  private settleHorizontal(gesture: Gesture) {
    if (!gesture.element || !gesture.toastId) {
      return;
    }

    if (Math.abs(gesture.dx) < DISMISS_PX) {
      this.springBack(gesture.element);
      return;
    }

    const direction = Math.sign(gesture.dx);
    this.dismiss(gesture.toastId, {
      x: direction * EXIT_TRAVEL_PX,
      y: 0,
      // The tilt sells a card being flicked off a deck; in a list it just looks untidy.
      rotate: this.isInOverviewMode() ? 0 : direction * 8,
    });
  }

  private settleVertical(gesture: Gesture) {
    if (this.isInOverviewMode()) {
      return;
    }

    // Unconditionally: a finger that pulled up and then came back down past its own start still
    // left the deck fanned, and is-fanning holds every transition off until it is cleared.
    this.unfan();

    if (gesture.dy < 0) {
      if (-gesture.dy >= EXPAND_PX) {
        this.expand();
      }
      return;
    }

    if (!gesture.element || !gesture.toastId) {
      return;
    }

    if (gesture.dy < DISMISS_PX) {
      this.springBack(gesture.element);
      return;
    }

    this.dismiss(gesture.toastId, { x: 0, y: EXIT_TRAVEL_PX, rotate: 0 });
  }

  /**
   * Pulling up stretches the gaps between the cards rather than hauling the whole deck along —
   * with only three of them visible, lifting the pile reveals nothing. The curve is a spring: it
   * gives freely at first and then resists, so it always answers the finger without ever running
   * out of travel. The deck's bottom edge stays put, because the host grows by exactly the extra
   * the deepest visible card takes up.
   */
  private paintFan(lift: number) {
    const stretch = 1 - Math.exp(-lift / EXPAND_PX);

    this.host.nativeElement.style.setProperty('--fan', stretch.toFixed(3));
  }

  private paintDrag(element: HTMLElement, dx: number, dy: number) {
    element.style.setProperty('--drag-x', Math.round(dx).toString());
    element.style.setProperty('--drag-y', Math.round(dy).toString());

    const travel = Math.max(Math.abs(dx), Math.abs(dy));
    element.style.setProperty('--drag-fade', (1 - Math.min(travel / 320, 0.5)).toFixed(3));
  }

  private springBack(element: HTMLElement) {
    element.classList.remove('is-dragging');
    element.classList.add('is-releasing');

    element.style.setProperty('--drag-x', '0');
    element.style.setProperty('--drag-y', '0');
    element.style.setProperty('--drag-fade', '1');

    element.addEventListener(
      'transitionend',
      () => {
        element.classList.remove('is-releasing');
        element.style.removeProperty('--drag-x');
        element.style.removeProperty('--drag-y');
        element.style.removeProperty('--drag-fade');
      },
      { once: true },
    );
  }

  /** Lets the fanned deck animate closed rather than snapping. */
  private unfan() {
    const host = this.host.nativeElement;

    host.classList.remove('is-fanning');

    // Reading layout flushes the class removal, so clearing --fan below animates rather than snaps.
    host.getBoundingClientRect();

    host.style.removeProperty('--fan');
  }

  private releasePointer() {
    this.gesture?.element?.classList.remove('is-dragging');
    this.gesture = null;

    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerEnd);
    window.removeEventListener('pointercancel', this.onPointerEnd);
  }

  private readonly onClickCapture = (event: MouseEvent) => {
    const dragged = this.suppressClickOn;
    if (!dragged) {
      return;
    }

    // The browser fires at most one click after a drag, so this is spent either way.
    this.suppressClickOn = null;

    if (dragged.contains(event.target as Node)) {
      event.stopPropagation();
      event.preventDefault();
    }
  };
}
