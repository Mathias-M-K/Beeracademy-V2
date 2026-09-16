import { signal } from '@angular/core';
import { Mock } from 'vitest';
import { ToastService } from '../app/services/toast/toast.service';
import { OverlayService } from '../app/services/overlay/overlay.service';
import { DrawerService } from '../app/services/drawer/drawer.service';
import { OverlayHandle } from '../app/services/overlay/models/overlay-handle';
import { createOverlayHandle } from './overlay';

type Stubbed<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? Mock<(...args: A) => R> : T[K];
};

export type ToastServiceStub = Stubbed<Pick<ToastService, 'showToast' | 'removeToast'>> &
  Pick<ToastService, 'toasts'>;

export function createToastServiceStub(): ToastServiceStub {
  return {
    toasts: signal([]).asReadonly(),
    showToast: vi.fn(),
    removeToast: vi.fn(),
  };
}

/** Every opened overlay is a real handle, recorded in `handles` in opening order. */
export type OverlayServiceStub = Stubbed<Pick<OverlayService, 'openOverlay'>> & {
  handles: OverlayHandle<unknown>[];
};

export function createOverlayServiceStub(): OverlayServiceStub {
  const handles: OverlayHandle<unknown>[] = [];
  return {
    handles,
    openOverlay: vi.fn(() => {
      const handle = createOverlayHandle();
      handles.push(handle);
      return handle;
    }) as unknown as OverlayServiceStub['openOverlay'],
  };
}

type DrawerMethods =
  | 'showPlayerOverviewDrawer'
  | 'showConfirmationDrawer'
  | 'showPartyShareDrawer'
  | 'showGamePausedDrawer'
  | 'showQrScanner'
  | 'showNewParticipantDrawer'
  | 'showLobbyParticipantSettingsDrawer';

/** Drawers returning a handle hand out a fresh real handle, recorded in `handles`. */
export type DrawerServiceStub = Stubbed<Pick<DrawerService, DrawerMethods>> & {
  handles: OverlayHandle<unknown>[];
};

export function createDrawerServiceStub(): DrawerServiceStub {
  const handles: OverlayHandle<unknown>[] = [];
  const handleFactory = () => {
    const handle = createOverlayHandle();
    handles.push(handle);
    return handle;
  };
  return {
    handles,
    showPlayerOverviewDrawer: vi.fn(),
    showConfirmationDrawer: vi.fn(),
    showPartyShareDrawer: vi.fn(),
    showGamePausedDrawer: vi.fn(handleFactory),
    showQrScanner: vi.fn(handleFactory),
    showNewParticipantDrawer: vi.fn(handleFactory),
    showLobbyParticipantSettingsDrawer: vi.fn(handleFactory),
  } as unknown as DrawerServiceStub;
}
