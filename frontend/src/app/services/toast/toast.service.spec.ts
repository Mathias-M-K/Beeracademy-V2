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
    vi.restoreAllMocks();
  });

  function panes(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>('.cdk-overlay-pane'));
  }

  function renderedToasts(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>('.cdk-overlay-container app-toast'));
  }

  describe('showToast', () => {
    it('adds the toast to the list', () => {
      // Arrange
      const title = 'Plads optaget';

      // Act
      service.showToast(title, 'Nogen andre er allerede logget ind med dit ID', 'close');

      // Assert
      expect(service.toasts()).toEqual([
        expect.objectContaining({
          title: 'Plads optaget',
          message: 'Nogen andre er allerede logget ind med dit ID',
          icon: 'close',
          toastState: ToastState.message,
          id: expect.stringMatching(/^toast-\d+$/),
        }),
      ]);
    });

    it('keeps the given toast state', () => {
      // Arrange
      const state = ToastState.error;

      // Act
      service.showToast('Miv :(', 'Kunne ikke forbinde', 'error', state);

      // Assert
      expect(service.toasts()[0].toastState).toBe(ToastState.error);
    });

    it('puts the newest toast first', () => {
      // Arrange
      service.showToast('First', 'one', 'info');

      // Act
      service.showToast('Second', 'two', 'info');

      // Assert
      expect(service.toasts().map((toast) => toast.title)).toEqual(['Second', 'First']);
    });

    it('gives every toast a unique id', () => {
      // Arrange
      service.showToast('First', 'one', 'info');

      // Act
      service.showToast('Second', 'two', 'info');

      // Assert
      const [second, first] = service.toasts();
      expect(second.id).not.toBe(first.id);
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
      expect(renderedToasts()[0].textContent).toContain('Hej');
    });

    it('reuses the open container for further toasts', () => {
      // Arrange
      service.showToast('First', 'one', 'info');

      // Act
      service.showToast('Second', 'two', 'info');
      TestBed.tick();

      // Assert
      expect(openOverlay).toHaveBeenCalledOnce();
      expect(panes()).toHaveLength(1);
      expect(renderedToasts()).toHaveLength(2);
    });
  });

  describe('removeToast', () => {
    it('removes only the toast with the given id', () => {
      // Arrange
      service.showToast('First', 'one', 'info');
      service.showToast('Second', 'two', 'info');
      const [second] = service.toasts();

      // Act
      service.removeToast(second.id);

      // Assert
      expect(service.toasts().map((toast) => toast.title)).toEqual(['First']);
    });

    it('keeps the container open while toasts remain', async () => {
      // Arrange
      service.showToast('First', 'one', 'info');
      service.showToast('Second', 'two', 'info');
      const [second] = service.toasts();

      // Act
      service.removeToast(second.id);
      await flushMicrotasks();

      // Assert
      expect(panes()).toHaveLength(1);
    });

    it('ignores an unknown id', async () => {
      // Arrange
      service.showToast('First', 'one', 'info');

      // Act
      service.removeToast('toast-unknown');
      await flushMicrotasks();

      // Assert
      expect(service.toasts()).toHaveLength(1);
      expect(panes()).toHaveLength(1);
    });

    it('closes the container once the last toast is removed', async () => {
      // Arrange
      service.showToast('First', 'one', 'info');
      const [first] = service.toasts();

      // Act
      service.removeToast(first.id);
      await flushMicrotasks();

      // Assert
      expect(service.toasts()).toEqual([]);
      expect(panes()).toHaveLength(0);
    });

    it('opens a fresh container for a toast after the previous one closed', async () => {
      // Arrange
      service.showToast('First', 'one', 'info');
      service.removeToast(service.toasts()[0].id);
      await flushMicrotasks();

      // Act
      service.showToast('Second', 'two', 'info');
      await flushMicrotasks();

      // Assert
      expect(openOverlay).toHaveBeenCalledTimes(2);
      expect(panes()).toHaveLength(1);
    });

    it('removes a toast when it is clicked', async () => {
      // Arrange
      service.showToast('First', 'one', 'info');
      TestBed.tick();

      // Act
      renderedToasts()[0].click();
      await flushMicrotasks();

      // Assert
      expect(service.toasts()).toEqual([]);
      expect(panes()).toHaveLength(0);
    });

    // known-issues: ToastService.removeToast clears overlayActive before the closing overlay resolves, so a toast shown meanwhile stacks a second container
    it.fails('never has more than one toast container open', async () => {
      // Arrange
      service.showToast('First', 'one', 'info');
      service.removeToast(service.toasts()[0].id);
      service.showToast('Second', 'two', 'info');
      await flushMicrotasks();

      // Act
      service.showToast('Third', 'three', 'info');
      await flushMicrotasks();

      // Assert
      expect(panes()).toHaveLength(1);
      expect(openOverlay).toHaveBeenCalledTimes(2);
    });
  });
});
