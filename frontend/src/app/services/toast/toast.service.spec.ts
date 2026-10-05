import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';
import { OverlayService } from '../overlay/overlay.service';
import { ToastState } from '../../overlay/toast/models/toast-data';
import { ToastContainer } from '../../overlay/toast/toast-container/toast-container';
import { flushMicrotasks } from '../../../testing/async';

describe('ToastService', () => {
  let service: ToastService;
  let openOverlay: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    expect(document.querySelectorAll('.cdk-overlay-pane')).toHaveLength(0);

    openOverlay = vi.spyOn(TestBed.inject(OverlayService), 'openOverlay');
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function panes(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>('.cdk-overlay-pane'));
  }

  function renderedToasts(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>('.cdk-overlay-container app-toast'));
  }

  describe('showToast', () => {
    it('shows the given toast', () => {
      // Arrange
      const title = 'Plads optaget';

      // Act
      service.showToast(title, 'Nogen andre er allerede logget ind med dit ID', 'close');

      // Assert
      expect(service.toast()).toEqual(
        expect.objectContaining({
          title,
          message: 'Nogen andre er allerede logget ind med dit ID',
          toastState: ToastState.message,
          id: expect.stringMatching(/^toast-\d+$/),
        }),
      );
    });

    it('keeps the given toast state', () => {
      // Arrange
      const state = ToastState.error;

      // Act
      service.showToast('Miv :(', 'Kunne ikke forbinde', 'error', state);

      // Assert
      expect(service.toast()?.toastState).toBe(ToastState.error);
    });

    it('replaces the current toast with the new one', () => {
      // Arrange
      service.showToast('First', 'one', 'info');
      const first = service.toast();

      // Act
      service.showToast('Second', 'two', 'info');

      // Assert
      expect(service.toast()?.message).toBe('two');
      expect(service.toast()?.id).not.toBe(first?.id);
    });
  });

  describe('toast overlay', () => {
    it('opens a toast container without a backdrop for the first toast', () => {
      // Arrange
      const title = 'Hej';

      // Act
      service.showToast(title, 'Velkommen', 'info');
      TestBed.tick();

      // Assert
      expect(openOverlay).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ component: ToastContainer, backdrop: false }),
      );
      expect(panes()).toHaveLength(1);
      expect(document.querySelector('.cdk-overlay-backdrop')).toBeNull();
      expect(renderedToasts()).toHaveLength(1);
      expect(renderedToasts()[0].textContent).toContain('Velkommen');
    });

    it('reuses the open container when a toast is replaced', () => {
      // Arrange
      service.showToast('First', 'one', 'info');
      TestBed.tick();

      // Act
      service.showToast('Second', 'two', 'info');
      TestBed.tick();

      // Assert
      expect(openOverlay).toHaveBeenCalledOnce();
      expect(panes()).toHaveLength(1);
      expect(renderedToasts().at(-1)?.textContent).toContain('two');
    });
  });

  describe('auto-dismiss', () => {
    it('dismisses the toast once its duration runs out', async () => {
      // Arrange
      vi.useFakeTimers();
      service.showToast('First', 'one', 'info', ToastState.success);
      const durationMs = service.toast()!.durationMs;

      // Act
      vi.advanceTimersByTime(durationMs);
      await flushMicrotasks();

      // Assert
      expect(service.toast()).toBeNull();
      expect(panes()).toHaveLength(0);
    });

    it('keeps the toast until its duration has run out', () => {
      // Arrange
      vi.useFakeTimers();
      service.showToast('First', 'one', 'info');
      const durationMs = service.toast()!.durationMs;

      // Act
      vi.advanceTimersByTime(durationMs - 1);

      // Assert
      expect(service.toast()?.message).toBe('one');
    });

    it('restarts the countdown when a new toast replaces the current one', () => {
      // Arrange
      vi.useFakeTimers();
      service.showToast('First', 'one', 'info');
      const firstDurationMs = service.toast()!.durationMs;
      vi.advanceTimersByTime(firstDurationMs - 1);
      service.showToast('Second', 'two', 'info');
      const secondDurationMs = service.toast()!.durationMs;

      // Act
      vi.advanceTimersByTime(secondDurationMs - 1);

      // Assert
      expect(service.toast()?.message).toBe('two');
    });
  });

  describe('dismissToast', () => {
    it('clears the toast and closes the container', async () => {
      // Arrange
      service.showToast('First', 'one', 'info');
      const toastId = service.toast()!.id;

      // Act
      service.dismissToast(toastId);
      await flushMicrotasks();

      // Assert
      expect(service.toast()).toBeNull();
      expect(panes()).toHaveLength(0);
    });

    it('ignores the id of a toast that was already replaced', async () => {
      // Arrange
      service.showToast('First', 'one', 'info');
      const replacedId = service.toast()!.id;
      service.showToast('Second', 'two', 'info');

      // Act
      service.dismissToast(replacedId);
      await flushMicrotasks();

      // Assert
      expect(service.toast()?.message).toBe('two');
      expect(panes()).toHaveLength(1);
    });

    it('opens a fresh container for a toast after the previous one closed', async () => {
      // Arrange
      service.showToast('First', 'one', 'info');
      service.dismissToast(service.toast()!.id);
      await flushMicrotasks();

      // Act
      service.showToast('Second', 'two', 'info');
      await flushMicrotasks();

      // Assert
      expect(openOverlay).toHaveBeenCalledTimes(2);
      expect(panes()).toHaveLength(1);
    });

    it('never has more than one toast container open', async () => {
      // Arrange
      service.showToast('First', 'one', 'info');
      service.dismissToast(service.toast()!.id);

      // Act
      service.showToast('Second', 'two', 'info');
      const panesWhileClosing = panes().length;
      await flushMicrotasks();

      // Assert
      expect(panesWhileClosing).toBe(1);
      expect(panes()).toHaveLength(1);
      expect(openOverlay).toHaveBeenCalledTimes(2);
      expect(service.toast()?.message).toBe('two');
    });
  });
});
