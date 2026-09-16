import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayPositionBuilder } from '@angular/cdk/overlay';
import { OverlayService } from './overlay.service';
import { OVERLAY_DATA, OverlayHandle } from './models/overlay-handle';
import { flushMicrotasks } from '../../../testing/async';

@Component({
  selector: 'app-probe-overlay',
  template: '<p class="probe">{{ data }}</p>',
})
class ProbeOverlay {
  public readonly data = inject(OVERLAY_DATA);
  public readonly handle = inject(OverlayHandle);
}

describe('OverlayService', () => {
  let service: OverlayService;

  beforeEach(() => {
    expect(document.querySelectorAll('.cdk-overlay-pane')).toHaveLength(0);
    service = TestBed.inject(OverlayService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function container(): HTMLElement {
    return document.querySelector<HTMLElement>('.cdk-overlay-container')!;
  }

  function panes(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>('.cdk-overlay-pane'));
  }

  function probe(): HTMLElement | null {
    return container()?.querySelector<HTMLElement>('app-probe-overlay') ?? null;
  }

  function probeInstance(): ProbeOverlay {
    const pane = panes()[0];
    expect(pane).toBeDefined();
    return (
      window as unknown as { ng: { getComponent: (el: Element) => ProbeOverlay } }
    ).ng.getComponent(probe()!);
  }

  describe('opening an overlay', () => {
    it('renders the component inside the overlay container', () => {
      // Arrange
      const conf = { component: ProbeOverlay, data: 'hello' };

      // Act
      service.openOverlay(conf);
      TestBed.tick();

      // Assert
      expect(panes()).toHaveLength(1);
      expect(probe()?.textContent).toContain('hello');
    });

    it('injects the data and the returned handle into the component', () => {
      // Arrange
      const data = { partyId: 'ABCDEFGHI' };

      // Act
      const handle = service.openOverlay({ component: ProbeOverlay, data });

      // Assert
      expect(probeInstance().data).toBe(data);
      expect(probeInstance().handle).toBe(handle);
    });

    it('adds the component classes to the rendered component', () => {
      // Arrange
      const conf = { component: ProbeOverlay, componentClasses: ['drawer-pane', 'compact'] };

      // Act
      service.openOverlay(conf);

      // Assert
      expect(probe()?.classList).toContain('drawer-pane');
      expect(probe()?.classList).toContain('compact');
    });

    it('centres the overlay unless a position is given', () => {
      // Arrange
      const conf = { component: ProbeOverlay };

      // Act
      service.openOverlay(conf);
      TestBed.tick();

      // Assert
      expect(panes()[0].parentElement?.style.justifyContent).toBe('center');
      expect(panes()[0].parentElement?.style.alignItems).toBe('center');
    });

    it('uses the given position strategy', () => {
      // Arrange
      const position = TestBed.inject(OverlayPositionBuilder)
        .global()
        .centerHorizontally()
        .bottom();

      // Act
      service.openOverlay({ component: ProbeOverlay, position });
      TestBed.tick();

      // Assert
      expect(panes()[0].parentElement?.style.alignItems).toBe('flex-end');
    });
  });

  describe('backdrop', () => {
    it('adds a backdrop with the default class', () => {
      // Arrange
      const conf = { component: ProbeOverlay };

      // Act
      service.openOverlay(conf);

      // Assert
      const backdrop = container().querySelector('.cdk-overlay-backdrop');
      expect(backdrop?.classList).toContain('overlay-backdrop');
    });

    it('uses a custom backdrop class', () => {
      // Arrange
      const conf = { component: ProbeOverlay, backdropClass: 'drawer-backdrop' };

      // Act
      service.openOverlay(conf);

      // Assert
      const backdrop = container().querySelector('.cdk-overlay-backdrop');
      expect(backdrop?.classList).toContain('drawer-backdrop');
      expect(backdrop?.classList).not.toContain('overlay-backdrop');
    });

    it('can be opened without a backdrop', () => {
      // Arrange
      const conf = { component: ProbeOverlay, backdrop: false, backdropClass: 'ignored' };

      // Act
      service.openOverlay(conf);

      // Assert
      expect(panes()).toHaveLength(1);
      expect(container().querySelector('.cdk-overlay-backdrop')).toBeNull();
    });

    it('does not close on backdrop click by default', async () => {
      // Arrange
      const handle = service.openOverlay({ component: ProbeOverlay });
      const closed = vi.fn();
      void handle.closed.then(closed);

      // Act
      container().querySelector<HTMLElement>('.cdk-overlay-backdrop')!.click();
      await flushMicrotasks();

      // Assert
      expect(closed).not.toHaveBeenCalled();
      expect(panes()).toHaveLength(1);
    });

    it('closes without a result on backdrop click when enabled', async () => {
      // Arrange
      const handle = service.openOverlay({ component: ProbeOverlay, dismissOnBackdropClick: true });
      const closed = vi.fn();
      void handle.closed.then(closed);

      // Act
      container().querySelector<HTMLElement>('.cdk-overlay-backdrop')!.click();
      await flushMicrotasks();

      // Assert
      expect(closed).toHaveBeenCalledExactlyOnceWith(undefined);
      expect(probe()).toBeNull();
    });
  });

  describe('closing', () => {
    it('removes the component when the handle closes', async () => {
      // Arrange
      const handle = service.openOverlay<string>({ component: ProbeOverlay });

      // Act
      await handle.close('done');

      // Assert
      expect(probe()).toBeNull();
      await expect(handle.closed).resolves.toBe('done');
    });

    it('keeps other overlays open when one closes', async () => {
      // Arrange
      const first = service.openOverlay({ component: ProbeOverlay, data: 'first' });
      service.openOverlay({ component: ProbeOverlay, data: 'second' });
      TestBed.tick();

      // Act
      await first.close();

      // Assert
      const remaining = container().querySelectorAll('app-probe-overlay');
      expect(remaining).toHaveLength(1);
      expect(remaining[0].textContent).toContain('second');
    });
  });
});
