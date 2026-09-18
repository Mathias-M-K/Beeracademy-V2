import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal, signal } from '@angular/core';
import { Mock } from 'vitest';
import { ToastContainer } from './toast-container';
import { ToastService } from '../../../services/toast/toast.service';
import { ToastData } from '../models/toast-data';

describe('ToastContainer', () => {
  let toasts: WritableSignal<ToastData[]>;
  let removeToast: Mock;

  beforeEach(() => {
    toasts = signal<ToastData[]>([]);
    removeToast = vi.fn();
  });

  async function render() {
    TestBed.configureTestingModule({
      providers: [{ provide: ToastService, useValue: { toasts, removeToast } }],
    });
    const fixture = TestBed.createComponent(ToastContainer);
    await fixture.whenStable();
    return fixture;
  }

  async function setToasts(fixture: ComponentFixture<ToastContainer>, count: number) {
    toasts.set(
      Array.from({ length: count }, (_, i) => new ToastData(`Titel ${i}`, `toast ${i}`, 'info')),
    );
    await fixture.whenStable();
  }

  function rendered(fixture: ComponentFixture<ToastContainer>): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('app-toast'));
  }

  function depths(fixture: ComponentFixture<ToastContainer>): string[] {
    return rendered(fixture).map((el) => el.style.getPropertyValue('--depth'));
  }

  function toastCount(fixture: ComponentFixture<ToastContainer>): string {
    return fixture.nativeElement.style.getPropertyValue('--toast-count');
  }

  function isInOverview(fixture: ComponentFixture<ToastContainer>): boolean {
    return fixture.nativeElement.classList.contains('toast-overview');
  }

  /** Ends a toast's countdown, which is how a stacked toast dismisses itself. */
  function timeOut(fixture: ComponentFixture<ToastContainer>, index: number) {
    rendered(fixture)
      [index].querySelector('.countdown')!
      .dispatchEvent(new Event('animationend', { bubbles: true }));
  }

  function badge(fixture: ComponentFixture<ToastContainer>): HTMLElement | null {
    return fixture.nativeElement.querySelector('.toast-count-badge');
  }

  function badgeRollsDown(fixture: ComponentFixture<ToastContainer>): boolean {
    return badge(fixture)!.classList.contains('rolls-down');
  }

  async function addToast(fixture: ComponentFixture<ToastContainer>) {
    toasts.update((current) => [...current, new ToastData('Nyt', 'ny hændelse', 'info')]);
    await fixture.whenStable();
  }

  async function openOverview(fixture: ComponentFixture<ToastContainer>) {
    badge(fixture)!.click();
    await fixture.whenStable();
  }

  describe('the stack', () => {
    it('counts depth from the newest toast backwards', async () => {
      // Arrange
      const fixture = await render();

      // Act
      await setToasts(fixture, 3);

      // Assert
      expect(depths(fixture)).toEqual(['2', '1', '0']);
    });

    it('keeps reporting true depth past the visible cap', async () => {
      // Arrange
      const fixture = await render();

      // Act
      await setToasts(fixture, 4);

      // Assert
      expect(depths(fixture)).toEqual(['3', '2', '1', '0']);
    });

    it('buries every toast stacked behind the third', async () => {
      // Arrange
      const fixture = await render();

      // Act
      await setToasts(fixture, 5);

      // Assert
      const buried = rendered(fixture).map((el) => el.classList.contains('is-buried'));
      expect(buried).toEqual([true, true, false, false, false]);
    });

    it('promotes the survivors when the front toast is removed', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);

      // Act
      toasts.update((current) => current.slice(0, -1));
      await fixture.whenStable();

      // Assert
      expect(depths(fixture)).toEqual(['1', '0']);
    });

    it('offers the count badge on the front toast only', async () => {
      // Arrange
      const fixture = await render();

      // Act
      await setToasts(fixture, 3);

      // Assert
      const badges = fixture.nativeElement.querySelectorAll('.toast-count-badge');
      expect(badges).toHaveLength(1);
      expect(badges[0].textContent).toContain('2 mere');
    });

    it('rolls the badge number upwards when a toast joins the stack', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 2);

      // Act
      await addToast(fixture);

      // Assert
      expect(badge(fixture)!.textContent).toContain('2 mere');
      expect(badgeRollsDown(fixture)).toBe(false);
    });

    it('rolls the badge number downwards when a toast leaves the stack', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);

      // Act
      toasts.update((current) => current.slice(1));
      await fixture.whenStable();

      // Assert
      expect(badge(fixture)!.textContent).toContain('1 mere');
      expect(badgeRollsDown(fixture)).toBe(true);
    });
    it('keeps the badge away from a lone toast', async () => {
      // Arrange
      const fixture = await render();

      // Act
      await setToasts(fixture, 1);

      // Assert
      expect(badge(fixture)).toBeNull();
    });
  });

  describe('the overview', () => {
    it('opens from the count badge', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);

      // Act
      await openOverview(fixture);

      // Assert
      expect(isInOverview(fixture)).toBe(true);
    });

    it('lays the toasts out as rows', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);

      // Act
      await openOverview(fixture);

      // Assert
      expect(rendered(fixture).every((el) => el.classList.contains('is-row'))).toBe(true);
    });

    it('freezes every countdown while it is open', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);
      expect(rendered(fixture).some((el) => el.classList.contains('is-paused'))).toBe(false);

      // Act
      await openOverview(fixture);

      // Assert
      expect(rendered(fixture).every((el) => el.classList.contains('is-paused'))).toBe(true);
    });

    it('closes again from the header', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);
      await openOverview(fixture);

      // Act
      const actions = fixture.nativeElement.querySelectorAll('.overview-header .link-button');
      actions[actions.length - 1].click();
      await fixture.whenStable();

      // Assert
      expect(isInOverview(fixture)).toBe(false);
    });

    it('closes again from the scrim', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);
      await openOverview(fixture);

      // Act
      fixture.nativeElement.querySelector('.overview-scrim').click();
      await fixture.whenStable();

      // Assert
      expect(isInOverview(fixture)).toBe(false);
    });

    it('takes the scrim out of the tab order once it is closed', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);
      await openOverview(fixture);
      const scrim: HTMLElement = fixture.nativeElement.querySelector('.overview-scrim');
      expect(scrim.getAttribute('tabindex')).toBeNull();

      // Act
      fixture.nativeElement.querySelector('.overview-scrim').click();
      await fixture.whenStable();

      // Assert
      expect(scrim.getAttribute('tabindex')).toBe('-1');
    });

    it('closes again on Escape', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);
      await openOverview(fixture);

      // Act
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await fixture.whenStable();

      // Assert
      expect(isInOverview(fixture)).toBe(false);
    });

    it('brings the buried toasts back into reach', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 5);
      expect(rendered(fixture)[0].getAttribute('aria-hidden')).toBe('true');

      // Act
      await openOverview(fixture);

      // Assert
      const hidden = rendered(fixture).map((el) => el.getAttribute('aria-hidden'));
      const tabbable = rendered(fixture).map((el) => el.getAttribute('tabindex'));
      expect(hidden).toEqual([null, null, null, null, null]);
      expect(tabbable).toEqual(['0', '0', '0', '0', '0']);
    });

    it('reports how many toasts it is showing', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);

      // Act
      await openOverview(fixture);

      // Assert
      expect(
        fixture.nativeElement.querySelector('.overview-header .subtitle').textContent,
      ).toContain('3 hændelser');
    });

    it('empties the whole list from the header', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);
      await openOverview(fixture);
      const ids = toasts().map((toast) => toast.id);

      // Act
      fixture.nativeElement.querySelector('.overview-header .link-button').click();
      await fixture.whenStable();

      // Assert
      expect(removeToast.mock.calls.flat()).toEqual(ids);
    });
  });

  describe('direct manipulation', () => {
    function pointer(type: string, x: number, y: number, pointerType = 'touch'): PointerEvent {
      return new PointerEvent(type, {
        bubbles: true,
        composed: true,
        clientX: x,
        clientY: y,
        pointerId: 1,
        pointerType,
        isPrimary: true,
        button: 0,
      });
    }

    /**
     * Drives a whole gesture on one toast. Synchronous on purpose: the handler ticks change
     * detection itself, and awaiting here would let the exit finish and clear what we assert on.
     */
    function drag(
      fixture: ComponentFixture<ToastContainer>,
      index: number,
      dx: number,
      dy: number,
      options: { pointerType?: string; end?: 'up' | 'cancel' | 'none' } = {},
    ) {
      const element = rendered(fixture)[index];
      const pointerType = options.pointerType ?? 'touch';

      element.dispatchEvent(pointer('pointerdown', 0, 0, pointerType));
      window.dispatchEvent(pointer('pointermove', dx / 2, dy / 2, pointerType));
      window.dispatchEvent(pointer('pointermove', dx, dy, pointerType));

      if (options.end === 'none') {
        return element;
      }

      const end = options.end === 'cancel' ? 'pointercancel' : 'pointerup';
      window.dispatchEvent(pointer(end, dx, dy, pointerType));

      return element;
    }

    function exitOf(element: HTMLElement) {
      return {
        x: element.style.getPropertyValue('--exit-x'),
        y: element.style.getPropertyValue('--exit-y'),
        rotate: element.style.getPropertyValue('--exit-rotate'),
      };
    }

    describe('swiping a toast away', () => {
      it('flings the front toast out along the swipe', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);

        // Act
        const element = drag(fixture, 2, 140, 0);

        // Assert
        expect(exitOf(element)).toEqual({ x: '420px', y: '0px', rotate: '8deg' });
      });

      it('carries the direction of the swipe into the exit', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);

        // Act
        const element = drag(fixture, 2, -140, 0);

        // Assert
        expect(exitOf(element)).toEqual({ x: '-420px', y: '0px', rotate: '-8deg' });
      });

      it('leaves an overview row square on its way out', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);
        await openOverview(fixture);

        // Act
        const element = drag(fixture, 0, 140, 0);

        // Assert
        expect(exitOf(element)).toEqual({ x: '420px', y: '0px', rotate: '0deg' });
      });

      it('springs a half-hearted swipe back instead of dismissing it', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);

        // Act
        const element = drag(fixture, 2, 40, 0);
        await fixture.whenStable();

        // Assert
        expect(removeToast).not.toHaveBeenCalled();
        expect(element.classList.contains('is-releasing')).toBe(true);
        expect(element.style.getPropertyValue('--drag-x')).toBe('0');
      });

      it('drops a toast dragged downwards out of the deck', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);

        // Act
        const element = drag(fixture, 2, 0, 140);

        // Assert
        expect(exitOf(element)).toEqual({ x: '0px', y: '420px', rotate: '0deg' });
      });

      it('paints the toast along with the finger', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);

        // Act
        const element = drag(fixture, 2, 60, 0, { end: 'none' });

        // Assert
        expect(element.style.getPropertyValue('--drag-x')).toBe('60');
        expect(element.classList.contains('is-dragging')).toBe(true);
        expect(Number(element.style.getPropertyValue('--drag-fade'))).toBeLessThan(1);
      });
    });

    describe('what may be dragged', () => {
      it('leaves the buried toasts alone while stacked', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);

        // Act
        const element = drag(fixture, 0, 140, 0);
        await fixture.whenStable();

        // Assert
        expect(removeToast).not.toHaveBeenCalled();
        expect(element.style.getPropertyValue('--drag-x')).toBe('');
      });

      it('lets any row be dragged in the overview', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);
        await openOverview(fixture);

        // Act
        drag(fixture, 0, 140, 0);
        await fixture.whenStable();

        // Assert
        expect(removeToast).toHaveBeenCalledExactlyOnceWith(toasts()[0].id);
      });

      it('keeps its hands off the header', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);
        await openOverview(fixture);
        const header: HTMLElement = fixture.nativeElement.querySelector('.overview-header');

        // Act
        header.dispatchEvent(pointer('pointerdown', 0, 0));
        window.dispatchEvent(pointer('pointermove', 140, 0));
        window.dispatchEvent(pointer('pointerup', 140, 0));
        await fixture.whenStable();

        // Assert
        expect(removeToast).not.toHaveBeenCalled();
      });
    });

    describe('pulling the deck open', () => {
      it('opens the overview once the pull is committed', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);

        // Act
        drag(fixture, 2, 0, -80);
        await fixture.whenStable();

        // Assert
        expect(isInOverview(fixture)).toBe(true);
      });

      it('stretches the deck while the finger is still down', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);

        // Act
        drag(fixture, 2, 0, -80, { end: 'none' });

        // Assert
        const fan = Number(fixture.nativeElement.style.getPropertyValue('--fan'));
        expect(fan).toBeGreaterThan(0);
        expect(fan).toBeLessThan(1);
        expect(fixture.nativeElement.classList.contains('is-fanning')).toBe(true);
      });

      it('lets the deck fall back when the pull was too short', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);

        // Act
        drag(fixture, 2, 0, -30);
        await fixture.whenStable();

        // Assert
        expect(isInOverview(fixture)).toBe(false);
        expect(fixture.nativeElement.classList.contains('is-fanning')).toBe(false);
        expect(fixture.nativeElement.style.getPropertyValue('--fan')).toBe('');
      });

      it('gives the vertical axis to the scroller in the overview', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);
        await openOverview(fixture);

        // Act
        drag(fixture, 0, 0, -80);
        await fixture.whenStable();

        // Assert
        expect(fixture.nativeElement.style.getPropertyValue('--fan')).toBe('');
        expect(removeToast).not.toHaveBeenCalled();
      });
    });

    describe('deciding what a gesture meant', () => {
      it('gives a thumb more room to wobble than a mouse', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);

        // Act
        const wobbled = drag(fixture, 2, 10, 0, { end: 'none' });

        // Assert
        expect(wobbled.classList.contains('is-dragging')).toBe(false);
      });

      it('commits a mouse at the smaller slop', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);

        // Act
        const moved = drag(fixture, 2, 10, 0, { pointerType: 'mouse', end: 'none' });

        // Assert
        expect(moved.classList.contains('is-dragging')).toBe(true);
      });

      it('ignores a mouse gesture that did not start on the left button', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);
        const element = rendered(fixture)[2];

        // Act
        element.dispatchEvent(
          new PointerEvent('pointerdown', {
            bubbles: true,
            clientX: 0,
            clientY: 0,
            pointerId: 1,
            pointerType: 'mouse',
            button: 2,
          }),
        );
        window.dispatchEvent(pointer('pointermove', 140, 0, 'mouse'));
        window.dispatchEvent(pointer('pointerup', 140, 0, 'mouse'));
        await fixture.whenStable();

        // Assert
        expect(removeToast).not.toHaveBeenCalled();
      });

      it('treats a cancelled gesture as no decision at all', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);

        // Act
        const element = drag(fixture, 2, 200, 0, { end: 'cancel' });
        await fixture.whenStable();

        // Assert
        expect(removeToast).not.toHaveBeenCalled();
        expect(element.classList.contains('is-releasing')).toBe(true);
      });

      it('swallows the click that follows a real drag', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);
        const element = drag(fixture, 2, 40, 0);

        // Act
        element.click();
        await fixture.whenStable();

        // Assert
        expect(fixture.nativeElement.classList.contains('has-expanded')).toBe(false);
      });

      it('still lets a wobbly tap through', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);
        const element = drag(fixture, 2, 10, 0, { pointerType: 'mouse' });

        // Act
        element.click();
        await fixture.whenStable();

        // Assert
        expect(fixture.nativeElement.classList.contains('has-expanded')).toBe(true);
      });
    });

    describe('opening a card in the deck', () => {
      it('opens on a tap and closes on the next one', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);
        const element = rendered(fixture)[2];

        // Act
        element.click();
        await fixture.whenStable();
        const opened = element.classList.contains('is-expanded');
        element.click();
        await fixture.whenStable();

        // Assert
        expect(opened).toBe(true);
        expect(element.classList.contains('is-expanded')).toBe(false);
      });

      it('puts an opened card away when it is swiped off', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);
        rendered(fixture)[2].click();
        await fixture.whenStable();

        // Act
        drag(fixture, 2, 140, 0);

        // Assert
        expect(fixture.nativeElement.classList.contains('has-expanded')).toBe(false);
      });

      it('closes the opened card when the overview takes over', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);
        rendered(fixture)[2].click();
        await fixture.whenStable();

        // Act
        await openOverview(fixture);

        // Assert
        expect(fixture.nativeElement.classList.contains('has-expanded')).toBe(false);
      });
    });

    describe('settling', () => {
      it('stops reporting a resize once the list has finished moving', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);
        await openOverview(fixture);
        expect(fixture.nativeElement.classList.contains('is-resizing')).toBe(true);

        // Act
        const rows: HTMLElement = fixture.nativeElement.querySelector('.rows');
        rows.dispatchEvent(new TransitionEvent('transitionend', { propertyName: 'height' }));
        await fixture.whenStable();

        // Assert
        expect(fixture.nativeElement.classList.contains('is-resizing')).toBe(false);
      });

      it('ignores a transition that was not the list resizing', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);
        await openOverview(fixture);

        // Act
        const rows: HTMLElement = fixture.nativeElement.querySelector('.rows');
        rows.dispatchEvent(new TransitionEvent('transitionend', { propertyName: 'opacity' }));
        await fixture.whenStable();

        // Assert
        expect(fixture.nativeElement.classList.contains('is-resizing')).toBe(true);
      });

      it('clears the drag paint once the spring back has played', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);
        const element = drag(fixture, 2, 40, 0);

        // Act
        element.dispatchEvent(new TransitionEvent('transitionend', { propertyName: 'transform' }));
        await fixture.whenStable();

        // Assert
        expect(element.classList.contains('is-releasing')).toBe(false);
        expect(element.style.getPropertyValue('--drag-x')).toBe('');
      });

      it('does nothing when Escape arrives with the overview already closed', async () => {
        // Arrange
        const fixture = await render();
        await setToasts(fixture, 3);

        // Act
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await fixture.whenStable();

        // Assert
        expect(isInOverview(fixture)).toBe(false);
        expect(fixture.nativeElement.classList.contains('is-resizing')).toBe(false);
      });
    });
  });

  describe('exit lifecycle', () => {
    it('keeps the toast until its exit animation finishes', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);

      // Act
      timeOut(fixture, 1);
      fixture.detectChanges();

      // Assert
      expect(removeToast).not.toHaveBeenCalled();

      await fixture.whenStable();
      expect(removeToast).toHaveBeenCalledExactlyOnceWith(toasts()[1].id);
    });

    it('holds the leaving row at the depth it was dismissed from', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);

      // Act
      timeOut(fixture, 1);
      fixture.detectChanges();

      // Assert
      expect(depths(fixture)[1]).toBe('1');
    });

    it('promotes the survivors while the exit is still playing', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);
      expect(depths(fixture)).toEqual(['2', '1', '0']);

      // Act
      timeOut(fixture, 1);
      fixture.detectChanges();

      // Assert
      expect(depths(fixture)).toEqual(['1', '1', '0']);
    });

    it('frees the leaving slot at once and flags the exit', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);

      // Act
      timeOut(fixture, 1);
      fixture.detectChanges();

      // Assert
      expect(toastCount(fixture)).toBe('2');
      expect(fixture.nativeElement.classList.contains('is-exiting')).toBe(true);
    });

    it('sends a stacked toast down and out', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);

      // Act
      timeOut(fixture, 2);
      fixture.detectChanges();

      // Assert
      expect(rendered(fixture)[2].style.getPropertyValue('--exit-y')).toBe('260px');
      expect(rendered(fixture)[2].style.getPropertyValue('--exit-x')).toBe('0px');
      expect(rendered(fixture)[2].style.getPropertyValue('--exit-rotate')).toBe('0deg');
    });

    it('sends an overview row squarely off the side, with no tilt', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);
      await openOverview(fixture);

      // Act
      rendered(fixture)[2].click();
      fixture.detectChanges();

      // Assert
      expect(rendered(fixture)[2].style.getPropertyValue('--exit-x')).toBe('420px');
      expect(rendered(fixture)[2].style.getPropertyValue('--exit-y')).toBe('0px');
      expect(rendered(fixture)[2].style.getPropertyValue('--exit-rotate')).toBe('0deg');
    });

    it('ignores a second dismiss of the same toast', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);

      // Act
      timeOut(fixture, 1);
      timeOut(fixture, 1);
      await fixture.whenStable();

      // Assert
      expect(removeToast).toHaveBeenCalledOnce();
    });
  });

  describe('tap to open', () => {
    it('opens a stacked toast up to its full content', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);

      // Act
      rendered(fixture)[2].click();
      await fixture.whenStable();

      // Assert
      expect(rendered(fixture)[2].classList.contains('is-expanded')).toBe(true);
    });

    it('opens it rather than dismissing it', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);

      // Act
      rendered(fixture)[2].click();
      await fixture.whenStable();

      // Assert
      expect(removeToast).not.toHaveBeenCalled();
      expect(rendered(fixture)[2].classList.contains('is-leaving')).toBe(false);
    });

    it('puts it back on a second tap', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);
      rendered(fixture)[2].click();
      await fixture.whenStable();

      // Act
      rendered(fixture)[2].click();
      await fixture.whenStable();

      // Assert
      expect(rendered(fixture)[2].classList.contains('is-expanded')).toBe(false);
    });

    it('freezes that toast\u2019s countdown while it is open', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);

      // Act
      rendered(fixture)[2].click();
      await fixture.whenStable();

      // Assert
      expect(rendered(fixture)[2].classList.contains('is-paused')).toBe(true);
      expect(rendered(fixture)[1].classList.contains('is-paused')).toBe(false);
    });

    it('closes the opened toast when the overview takes over', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);
      rendered(fixture)[2].click();
      await fixture.whenStable();

      // Act
      await openOverview(fixture);

      // Assert
      expect(rendered(fixture).some((el) => el.classList.contains('is-expanded'))).toBe(false);
    });

    it('dismisses instead of opening once the overview is up', async () => {
      // Arrange
      const fixture = await render();
      await setToasts(fixture, 3);
      await openOverview(fixture);

      // Act
      rendered(fixture)[2].click();
      fixture.detectChanges();

      // Assert
      expect(rendered(fixture)[2].classList.contains('is-leaving')).toBe(true);
      expect(rendered(fixture)[2].classList.contains('is-expanded')).toBe(false);
    });
  });
});
