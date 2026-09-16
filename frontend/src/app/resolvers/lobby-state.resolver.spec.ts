import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RedirectCommand,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { lobbyStateResolver } from './lobby-state.resolver';
import { LobbyService } from '../services/lobby/lobby.service';
import { ToastService } from '../services/toast/toast.service';
import { createToastServiceStub, ToastServiceStub } from '../../testing/stubs';
import { WebsocketCode } from '../../api-models/model/websocketCode';

describe('lobbyStateResolver', () => {
  let toasts: ToastServiceStub;
  let connectToWebsocket: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    toasts = createToastServiceStub();
    connectToWebsocket = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: LobbyService, useValue: { connectToWebsocket } },
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
        lobbyStateResolver(
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

    it('tells the user the lobby could not be found when the session is missing', async () => {
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
        'Kunne ikke finde lobby',
        'close',
      );
    });

    // known-issues: lobbyStateResolver has no LobbyNotFound case, so a deleted lobby redirects silently
    it.fails('tells the user when the lobby no longer exists', async () => {
      // Arrange
      connectToWebsocket.mockRejectedValue(new Error('x', { cause: WebsocketCode.LobbyNotFound }));

      // Act
      const result = await resolve();

      // Assert
      expect(redirectUrl(result)).toBe('/start');
      expect(toasts.showToast).toHaveBeenCalledOnce();
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
