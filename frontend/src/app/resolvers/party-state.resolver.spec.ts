import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RedirectCommand,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { NEVER, Observable, of, Subject, throwError } from 'rxjs';
import { partyStateResolver } from './party-state.resolver';
import { PartyApi } from '../services/apis/party.api';
import { ToastService } from '../services/toast/toast.service';
import { OverlayService } from '../services/overlay/overlay.service';
import {
  createOverlayServiceStub,
  createToastServiceStub,
  OverlayServiceStub,
  ToastServiceStub,
} from '../../testing/stubs';
import { flushMicrotasks } from '../../testing/async';
import { PartyDto } from '../../api-models/model/partyDto';
import { PartyState } from '../../api-models/model/partyState';
import { ToastState } from '../overlay/toast/models/toast-data';
import { BeerLoaderOverlay } from '../overlay/beer-loader-overlay/beer-loader-overlay';
import { PARTY_ID } from '../../testing/game-builders';

describe('partyStateResolver', () => {
  const party: PartyDto = {
    partyState: PartyState.Game,
    name: 'Friday party',
    id: PARTY_ID,
    participants: [],
    session: { isConnected: true, isClaimed: true },
  };

  let toasts: ToastServiceStub;
  let overlays: OverlayServiceStub;
  let getParty: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    });

    toasts = createToastServiceStub();
    overlays = createOverlayServiceStub();
    getParty = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PartyApi, useValue: { getParty } },
        { provide: ToastService, useValue: toasts },
        { provide: OverlayService, useValue: overlays },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function resolve(): unknown[] {
    const route = { params: { 'party-id': PARTY_ID } } as unknown as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() =>
      partyStateResolver(route, {} as RouterStateSnapshot),
    ) as Observable<unknown>;

    const emitted: unknown[] = [];
    result.subscribe((value) => emitted.push(value));
    return emitted;
  }

  function redirectUrl(result: unknown): string {
    expect(result).toBeInstanceOf(RedirectCommand);
    return TestBed.inject(Router).serializeUrl((result as RedirectCommand).redirectTo);
  }

  function trackClosed(index: number): { closed: boolean } {
    const state = { closed: false };
    void overlays.handles[index].closed.then(() => (state.closed = true));
    return state;
  }

  describe('party lookup', () => {
    it('looks up the party from the route parameter', () => {
      // Arrange
      getParty.mockReturnValue(of(party));

      // Act
      const emitted = resolve();

      // Assert
      expect(getParty).toHaveBeenCalledExactlyOnceWith(PARTY_ID);
      expect(emitted).toEqual([party]);
      expect(toasts.showToast).not.toHaveBeenCalled();
    });

    it('redirects to the start page with an error toast when the lookup fails', () => {
      // Arrange
      getParty.mockReturnValue(throwError(() => new Error('404')));

      // Act
      const emitted = resolve();

      // Assert
      expect(emitted).toHaveLength(1);
      expect(redirectUrl(emitted[0])).toBe('/start');
      expect(toasts.showToast).toHaveBeenCalledExactlyOnceWith(
        'Miv :(',
        'Kunne ikke forbinde',
        'error',
        ToastState.error,
      );
    });

    it('does not give up before the 8 second timeout', () => {
      // Arrange
      getParty.mockReturnValue(NEVER);
      const emitted = resolve();

      // Act
      vi.advanceTimersByTime(7999);

      // Assert
      expect(emitted).toEqual([]);
      expect(toasts.showToast).not.toHaveBeenCalled();
    });

    it('redirects to the start page with a timeout toast after 8 seconds', () => {
      // Arrange
      getParty.mockReturnValue(NEVER);
      const emitted = resolve();

      // Act
      vi.advanceTimersByTime(8000);

      // Assert
      expect(emitted).toHaveLength(1);
      expect(redirectUrl(emitted[0])).toBe('/start');
      expect(toasts.showToast).toHaveBeenCalledExactlyOnceWith(
        'Timeout',
        'Måske tager serveren en pause',
        'error',
        ToastState.error,
      );
    });
  });

  describe('loader overlay', () => {
    it('is never shown when the party arrives immediately', () => {
      // Arrange
      getParty.mockReturnValue(of(party));
      resolve();

      // Act
      vi.advanceTimersByTime(1000);

      // Assert
      expect(overlays.openOverlay).not.toHaveBeenCalled();
    });

    it('is not shown before 150ms have passed', () => {
      // Arrange
      getParty.mockReturnValue(NEVER);
      resolve();

      // Act
      vi.advanceTimersByTime(149);

      // Assert
      expect(overlays.openOverlay).not.toHaveBeenCalled();
    });

    it('shows the beer loader when the lookup takes longer than 150ms', () => {
      // Arrange
      getParty.mockReturnValue(NEVER);
      resolve();

      // Act
      vi.advanceTimersByTime(150);

      // Assert
      expect(overlays.openOverlay).toHaveBeenCalledExactlyOnceWith({
        component: BeerLoaderOverlay,
        data: ['Tjekker om der er plads', 'Henter øl', 'Blander kort', 'Tjekker ting'],
      });
    });

    it('is dismissed once a slow lookup completes', async () => {
      // Arrange
      const response = new Subject<PartyDto>();
      getParty.mockReturnValue(response);
      const emitted = resolve();
      vi.advanceTimersByTime(200);
      const loader = trackClosed(0);

      // Act
      response.next(party);
      response.complete();
      await flushMicrotasks();

      // Assert
      expect(emitted).toEqual([party]);
      expect(loader.closed).toBe(true);
    });

    it('is dismissed when a slow lookup fails', async () => {
      // Arrange
      const response = new Subject<PartyDto>();
      getParty.mockReturnValue(response);
      resolve();
      vi.advanceTimersByTime(200);
      const loader = trackClosed(0);

      // Act
      response.error(new Error('500'));
      await flushMicrotasks();

      // Assert
      expect(loader.closed).toBe(true);
    });

    it('is dismissed when the lookup times out', async () => {
      // Arrange
      getParty.mockReturnValue(NEVER);
      resolve();
      vi.advanceTimersByTime(200);
      const loader = trackClosed(0);

      // Act
      vi.advanceTimersByTime(8000);
      await flushMicrotasks();

      // Assert
      expect(loader.closed).toBe(true);
      expect(overlays.openOverlay).toHaveBeenCalledOnce();
    });
  });
});
