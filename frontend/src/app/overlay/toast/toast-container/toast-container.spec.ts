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
