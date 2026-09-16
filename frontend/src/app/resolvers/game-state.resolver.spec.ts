import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RedirectCommand,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { gameStateResolver } from './game-state.resolver';
import { GameService } from '../services/game/game.service';
import { ToastService } from '../services/toast/toast.service';
import { createToastServiceStub, ToastServiceStub } from '../../testing/stubs';
import { WebsocketCode } from '../../api-models/model/websocketCode';
import { ToastState } from '../overlay/toast/models/toast-data';

describe('gameStateResolver', () => {
  let toasts: ToastServiceStub;
  let connectToWebsocket: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    toasts = createToastServiceStub();
    connectToWebsocket = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: GameService, useValue: { connectToWebsocket } },
        { provide: ToastService, useValue: toasts },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function resolve(): Promise<unknown> {
    return TestBed.runInInjectionContext(
      () =>
        gameStateResolver(
          {} as ActivatedRouteSnapshot,
          {} as RouterStateSnapshot,
        ) as Promise<unknown>,
    );
  }

  function redirectUrl(result: unknown): string {
    expect(result).toBeInstanceOf(RedirectCommand);
    return TestBed.inject(Router).serializeUrl((result as RedirectCommand).redirectTo);
  }

  describe('successful connection', () => {
    it('resolves without redirecting', async () => {
      // Arrange
      connectToWebsocket.mockResolvedValue(undefined);

      // Act
      const result = await resolve();

      // Assert
      expect(result).toBeUndefined();
      expect(connectToWebsocket).toHaveBeenCalledOnce();
      expect(toasts.showToast).not.toHaveBeenCalled();
    });
  });

  describe('rejected connection', () => {
    it('tells the user the seat is taken when the session is occupied', async () => {
      // Arrange
      connectToWebsocket.mockRejectedValue(
        new Error('x', { cause: WebsocketCode.SessionOccupied }),
      );

      // Act
      const result = await resolve();

      // Assert
      expect(redirectUrl(result)).toBe('/start');
      expect(toasts.showToast).toHaveBeenCalledExactlyOnceWith(
        'Plads optaget',
        'Nogen andre er allerede logget ind med dit ID',
        'close',
      );
    });

    it('tells the user the session was not found', async () => {
      // Arrange
      connectToWebsocket.mockRejectedValue(
        new Error('x', { cause: WebsocketCode.SessionNotFound }),
      );

      // Act
      const result = await resolve();

      // Assert
      expect(redirectUrl(result)).toBe('/start');
      expect(toasts.showToast).toHaveBeenCalledExactlyOnceWith(
        'Ikke fundet',
        expect.any(String),
        'close',
      );
    });

    it('shows an error toast when the game no longer exists', async () => {
      // Arrange
      connectToWebsocket.mockRejectedValue(new Error('x', { cause: WebsocketCode.GameNotFound }));

      // Act
      const result = await resolve();

      // Assert
      expect(redirectUrl(result)).toBe('/start');
      expect(toasts.showToast).toHaveBeenCalledExactlyOnceWith(
        'Der skete en fejl',
        'Spillet findes ikke længere',
        'error',
        ToastState.error,
      );
    });

    it.each([
      ['an unhandled close code', new Error('x', { cause: WebsocketCode.AbnormalClosure })],
      ['an error without a cause', new Error('x')],
      ['a non-Error rejection', 'boom'],
    ])('redirects to the start page on %s', async (_label, rejection) => {
      // Arrange
      connectToWebsocket.mockRejectedValue(rejection);

      // Act
      const result = await resolve();

      // Assert
      expect(redirectUrl(result)).toBe('/start');
      expect(toasts.showToast).not.toHaveBeenCalled();
    });
  });
});
