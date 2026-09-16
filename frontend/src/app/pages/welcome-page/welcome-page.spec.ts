import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of, Subject, throwError } from 'rxjs';
import { WelcomePage } from './welcome-page';
import { LobbyApi } from '../../services/apis/lobby-api.service';
import { PartyApi } from '../../services/apis/party.api';
import { ToastService } from '../../services/toast/toast.service';
import { DrawerService } from '../../services/drawer/drawer.service';
import {
  createDrawerServiceStub,
  createToastServiceStub,
  DrawerServiceStub,
  ToastServiceStub,
} from '../../../testing/stubs';
import { flushMicrotasks } from '../../../testing/async';
import { CurrentPartyDto } from '../../../api-models/model/currentPartyDto';
import { PartyState } from '../../../api-models/model/partyState';
import { Role } from '../../../api-models/model/role';
import { ToastState } from '../../overlay/toast/models/toast-data';

describe('WelcomePage', () => {
  let lobbyApi: { createLobby: ReturnType<typeof vi.fn> };
  let partyApi: { getCurrentParty: ReturnType<typeof vi.fn> };
  let toasts: ToastServiceStub;
  let drawers: DrawerServiceStub;
  let navigate: ReturnType<typeof vi.spyOn>;
  let compact: boolean;

  beforeEach(() => {
    lobbyApi = { createLobby: vi.fn(() => of({})) };
    partyApi = { getCurrentParty: vi.fn(() => of(null)) };
    toasts = createToastServiceStub();
    drawers = createDrawerServiceStub();
    compact = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function anExistingParty(overrides: Partial<CurrentPartyDto> = {}): CurrentPartyDto {
    return {
      role: Role.PlayerClient,
      playerId: 'p2',
      partyState: {
        id: 'ABCDEFGHI',
        name: 'Friday game',
        partyState: PartyState.Lobby,
        session: { isClaimed: true, isConnected: true },
        participants: [
          { id: 'p1', name: 'Mathias', session: { isClaimed: true, isConnected: true } },
          { id: 'p2', name: 'Lasse', session: { isClaimed: true, isConnected: true } },
        ],
      },
      ...overrides,
    };
  }

  async function render() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: LobbyApi, useValue: lobbyApi },
        { provide: PartyApi, useValue: partyApi },
        { provide: ToastService, useValue: toasts },
        { provide: DrawerService, useValue: drawers },
        {
          provide: BreakpointObserver,
          useValue: { observe: () => of({ matches: compact, breakpoints: {} }) },
        },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(WelcomePage);
    await fixture.whenStable();
    return fixture;
  }

  function button(fixture: ComponentFixture<WelcomePage>, text: string): HTMLButtonElement {
    const match = Array.from(
      fixture.nativeElement.querySelectorAll('button') as HTMLButtonElement[],
    ).find((candidate) => candidate.textContent?.trim() === text);
    if (!match) throw new Error(`No button with text "${text}"`);
    return match;
  }

  function existingParty(fixture: ComponentFixture<WelcomePage>): HTMLElement | null {
    return fixture.nativeElement.querySelector('#existing-game');
  }

  function lobbyNameInput(fixture: ComponentFixture<WelcomePage>): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[aria-label="lobby name"]');
  }

  function createButton(fixture: ComponentFixture<WelcomePage>): HTMLButtonElement {
    return lobbyNameInput(fixture).nextElementSibling as HTMLButtonElement;
  }

  describe('existing party', () => {
    it('is not offered when the user has no current party', async () => {
      // Arrange
      partyApi.getCurrentParty.mockReturnValue(of(null));

      // Act
      const fixture = await render();

      // Assert
      expect(existingParty(fixture)).toBeNull();
    });

    it.each([401, 404])('is not offered when looking it up fails with %i', async (status) => {
      // Arrange
      partyApi.getCurrentParty.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));

      // Act
      const fixture = await render();

      // Assert
      expect(existingParty(fixture)).toBeNull();
    });

    it('describes an active lobby the user takes part in', async () => {
      // Arrange
      partyApi.getCurrentParty.mockReturnValue(of(anExistingParty()));

      // Act
      const fixture = await render();

      // Assert
      const panel = existingParty(fixture)!;
      expect(panel.querySelector('h2')?.textContent).toBe('Friday game');
      expect(panel.textContent).toContain('Din lobby er stadigvæk aktiv');
      expect(panel.textContent).toContain('Du er Deltager | 2 deltagere');
      expect(panel.textContent).toContain('| Lasse');
      expect(panel.querySelector('button')?.textContent?.trim()).toBe('Åbn Lobby');
    });

    it('describes a running game the user hosts', async () => {
      // Arrange
      const party = anExistingParty({ role: Role.GameClient, playerId: undefined });
      party.partyState!.partyState = PartyState.Game;
      partyApi.getCurrentParty.mockReturnValue(of(party));

      // Act
      const fixture = await render();

      // Assert
      const panel = existingParty(fixture)!;
      expect(panel.textContent).toContain('Dit spil er stadigvæk igang');
      expect(panel.textContent).toContain('Du er Vært');
      expect(panel.textContent).not.toContain('| Lasse');
      expect(panel.querySelector('button')?.textContent?.trim()).toBe('Forsæt spillet');
    });

    it.each([
      [PartyState.Lobby, '/lobby'],
      [PartyState.Game, '/game'],
    ])('rejoins a %s party on its page', async (state, route) => {
      // Arrange
      const party = anExistingParty();
      party.partyState!.partyState = state;
      partyApi.getCurrentParty.mockReturnValue(of(party));
      const fixture = await render();

      // Act
      existingParty(fixture)!.querySelector('button')!.click();
      await fixture.whenStable();

      // Assert
      expect(navigate).toHaveBeenCalledWith([route]);
    });

    it('disables the buttons while rejoining', async () => {
      // Arrange
      partyApi.getCurrentParty.mockReturnValue(of(anExistingParty()));
      const fixture = await render();
      navigate.mockReturnValue(new Promise<boolean>(() => undefined));

      // Act
      existingParty(fixture)!.querySelector('button')!.click();
      await fixture.whenStable();

      // Assert
      expect(existingParty(fixture)!.querySelector('button')!.disabled).toBe(true);
      expect(createButton(fixture).disabled).toBe(true);
    });
  });

  describe('creating a lobby', () => {
    function enterName(fixture: ComponentFixture<WelcomePage>, name: string) {
      lobbyNameInput(fixture).value = name;
    }

    it('creates the lobby and opens it', async () => {
      // Arrange
      const fixture = await render();
      enterName(fixture, 'Hygge aften');

      // Act
      button(fixture, 'Opret lobby').click();
      await fixture.whenStable();

      // Assert
      expect(lobbyApi.createLobby).toHaveBeenCalledWith('Hygge aften');
      expect(navigate).toHaveBeenCalledWith(['/lobby']);
    });

    it('creates the lobby when Enter is pressed in the name field', async () => {
      // Arrange
      const fixture = await render();
      enterName(fixture, 'Hygge aften');

      // Act
      lobbyNameInput(fixture).dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
      await fixture.whenStable();

      // Assert
      expect(lobbyApi.createLobby).toHaveBeenCalledWith('Hygge aften');
    });

    it('requires a name that is not just whitespace', async () => {
      // Arrange
      const fixture = await render();
      enterName(fixture, '   ');

      // Act
      button(fixture, 'Opret lobby').click();
      await fixture.whenStable();

      // Assert
      expect(lobbyApi.createLobby).not.toHaveBeenCalled();
      expect(toasts.showToast).toHaveBeenCalledWith(
        'Du er dum',
        'Lobbyen skal have et navn',
        'sentiment_extremely_dissatisfied',
        ToastState.error,
      );
    });

    it('shows a loader and ignores further attempts while creating', async () => {
      // Arrange
      lobbyApi.createLobby.mockReturnValue(new Subject());
      const fixture = await render();
      enterName(fixture, 'Hygge aften');
      button(fixture, 'Opret lobby').click();
      await fixture.whenStable();

      // Act
      lobbyNameInput(fixture).dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
      await fixture.whenStable();

      // Assert
      expect(createButton(fixture).disabled).toBe(true);
      expect(createButton(fixture).getAttribute('aria-busy')).toBe('true');
      expect(createButton(fixture).querySelector('app-dot-loader')).not.toBeNull();
      expect(lobbyApi.createLobby).toHaveBeenCalledOnce();
    });

    it('re-enables creation and reports the failure when creating fails', async () => {
      // Arrange
      lobbyApi.createLobby.mockReturnValue(throwError(() => new Error('500')));
      const fixture = await render();
      enterName(fixture, 'Hygge aften');

      // Act
      button(fixture, 'Opret lobby').click();
      await fixture.whenStable();

      // Assert
      expect(navigate).not.toHaveBeenCalled();
      expect(toasts.showToast).toHaveBeenCalledWith(
        'Der skete en fejl',
        'Lobbyen kunne ikke oprettes',
        'error',
        ToastState.error,
      );
      expect(button(fixture, 'Opret lobby').disabled).toBe(false);
    });
  });

  describe('scanning a QR code', () => {
    function scannerPanel(fixture: ComponentFixture<WelcomePage>): HTMLElement {
      return fixture.nativeElement.querySelectorAll('.option')[1];
    }

    it('opens the join page of the scanned party', async () => {
      // Arrange
      const fixture = await render();
      button(fixture, 'Åbn Kamera').click();

      // Act
      await drawers.handles[0].close('ABCDEFGHI');
      await flushMicrotasks();

      // Assert
      expect(drawers.showQrScanner).toHaveBeenCalledOnce();
      expect(navigate).toHaveBeenCalledWith(['/join', 'ABCDEFGHI']);
    });

    it('stays on the page when the scanner is dismissed', async () => {
      // Arrange
      const fixture = await render();
      button(fixture, 'Åbn Kamera').click();

      // Act
      await drawers.handles[0].dismiss();
      await flushMicrotasks();

      // Assert
      expect(navigate).not.toHaveBeenCalled();
    });

    it('does not open the scanner when the panel is clicked on a wide screen', async () => {
      // Arrange
      compact = false;
      const fixture = await render();

      // Act
      scannerPanel(fixture).click();

      // Assert
      expect(scannerPanel(fixture).getAttribute('role')).toBeNull();
      expect(drawers.showQrScanner).not.toHaveBeenCalled();
    });

    it.each([
      ['a click', (panel: HTMLElement) => panel.click()],
      [
        'Enter',
        (panel: HTMLElement) => panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })),
      ],
      [
        'Space',
        (panel: HTMLElement) => panel.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' })),
      ],
    ])('opens the scanner on %s on the panel on a compact screen', async (_, activate) => {
      // Arrange
      compact = true;
      const fixture = await render();

      // Act
      activate(scannerPanel(fixture));

      // Assert
      expect(scannerPanel(fixture).getAttribute('role')).toBe('button');
      expect(drawers.showQrScanner).toHaveBeenCalledOnce();
    });
  });
});
