import { OverlayRef } from '@angular/cdk/overlay';
import { OverlayHandle } from './overlay-handle';
import { deferred, flushMicrotasks } from '../../../../testing/async';

describe('OverlayHandle', () => {
  interface FakeOverlayRef {
    overlayElement: HTMLElement;
    backdropElement: HTMLElement | null;
    dispose: ReturnType<typeof vi.fn>;
  }

  let overlayRef: FakeOverlayRef;
  let content: HTMLElement;
  let handle: OverlayHandle<string>;

  beforeEach(() => {
    content = document.createElement('div');
    const overlayElement = document.createElement('div');
    overlayElement.appendChild(content);

    overlayRef = {
      overlayElement,
      backdropElement: document.createElement('div'),
      dispose: vi.fn(),
    };
    handle = new OverlayHandle<string>(overlayRef as unknown as OverlayRef);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function trackClosed(): { settled: boolean; result?: string } {
    const state: { settled: boolean; result?: string } = { settled: false };
    void handle.closed.then((result) => {
      state.settled = true;
      state.result = result;
    });
    return state;
  }

  describe('close', () => {
    it('resolves closed with the given result', async () => {
      // Arrange
      const closed = trackClosed();

      // Act
      handle.close('confirmed');
      await handle.closed;

      // Assert
      expect(closed).toEqual({ settled: true, result: 'confirmed' });
    });

    it('disposes the overlay', async () => {
      // Act
      handle.close('confirmed');
      await handle.closed;

      // Assert
      expect(overlayRef.dispose).toHaveBeenCalledOnce();
    });

    it('resolves closed with undefined when no result is given', async () => {
      // Arrange
      const closed = trackClosed();

      // Act
      handle.close();
      await handle.closed;

      // Assert
      expect(closed).toEqual({ settled: true, result: undefined });
    });
  });

  describe('dismiss', () => {
    it('resolves closed without a result and disposes the overlay', async () => {
      // Arrange
      const closed = trackClosed();

      // Act
      handle.dismiss();
      await handle.closed;

      // Assert
      expect(closed).toEqual({ settled: true, result: undefined });
      expect(overlayRef.dispose).toHaveBeenCalledOnce();
    });
  });

  describe('closing twice', () => {
    it('ignores a second close', async () => {
      // Arrange
      const closed = trackClosed();
      handle.close('first');
      await handle.closed;

      // Act
      handle.close('second');
      await handle.closed;

      // Assert
      expect(closed.result).toBe('first');
      expect(overlayRef.dispose).toHaveBeenCalledOnce();
    });

    it('ignores a dismiss racing an in-flight close', async () => {
      // Arrange
      const closed = trackClosed();
      handle.close('button');

      // Act
      handle.dismiss();
      await handle.closed;

      // Assert
      expect(closed.result).toBe('button');
      expect(overlayRef.dispose).toHaveBeenCalledOnce();
    });
  });

  describe('exit animation', () => {
    it('marks the content and backdrop as leaving', async () => {
      // Arrange
      const backdrop = overlayRef.backdropElement!;

      // Act
      handle.close();
      await handle.closed;

      // Assert
      expect(content.classList).toContain('overlay-leaving');
      expect(backdrop.classList).toContain('backdrop-exiting');
    });

    it('works without a backdrop', async () => {
      // Arrange
      overlayRef.backdropElement = null;

      // Act
      handle.close('done');
      await handle.closed;

      // Assert
      expect(content.classList).toContain('overlay-leaving');
      expect(overlayRef.dispose).toHaveBeenCalledOnce();
    });

    it('waits for running animations before disposing', async () => {
      // Arrange
      const animation = deferred<Animation>();
      vi.spyOn(content, 'getAnimations').mockReturnValue([
        { finished: animation.promise } as unknown as Animation,
      ]);
      const closed = trackClosed();

      // Act
      handle.close('done');
      await flushMicrotasks();
      const disposedBeforeFinish = overlayRef.dispose.mock.calls.length;
      animation.resolve({} as Animation);
      await handle.closed;

      // Assert
      expect(disposedBeforeFinish).toBe(0);
      expect(closed.result).toBe('done');
      expect(overlayRef.dispose).toHaveBeenCalledOnce();
    });

    it('still closes when an animation is cancelled', async () => {
      // Arrange
      const animation = deferred<Animation>();
      vi.spyOn(content, 'getAnimations').mockReturnValue([
        { finished: animation.promise } as unknown as Animation,
      ]);
      const closed = trackClosed();

      // Act
      handle.close('done');
      animation.reject(new DOMException('cancelled', 'AbortError'));
      await handle.closed;

      // Assert
      expect(closed.result).toBe('done');
      expect(overlayRef.dispose).toHaveBeenCalledOnce();
    });

    it('skips the animation when dismissed with ignoreAnimation', async () => {
      // Arrange
      const getAnimations = vi.spyOn(content, 'getAnimations');

      // Act
      handle.dismiss(true);
      await handle.closed;

      // Assert
      expect(content.classList).not.toContain('overlay-leaving');
      expect(overlayRef.backdropElement!.classList).not.toContain('backdrop-exiting');
      expect(getAnimations).not.toHaveBeenCalled();
      expect(overlayRef.dispose).toHaveBeenCalledOnce();
    });

    it('closes an overlay that has no content element', async () => {
      // Arrange
      content.remove();
      const closed = trackClosed();

      // Act
      handle.close('empty');
      await handle.closed;

      // Assert
      expect(closed.result).toBe('empty');
      expect(overlayRef.dispose).toHaveBeenCalledOnce();
    });
  });
});
