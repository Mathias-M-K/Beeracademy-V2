import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { DrawerService } from './drawer.service';
import { OverlayService } from '../overlay/overlay.service';
import { OverlayHandle } from '../overlay/models/overlay-handle';
import { GameService } from '../game/game.service';
import { LobbyService } from '../lobby/lobby.service';
import { ToastService } from '../toast/toast.service';
import { createToastServiceStub } from '../../../testing/stubs';
import { flushMicrotasks } from '../../../testing/async';
import { PARTY_ID, aPlayerDto } from '../../../testing/game-builders';
import { PlayerOverviewDrawerComponent } from '../../drawer/player-overview-drawer/player-overview-drawer.component';
import { ConfirmationDrawer } from '../../drawer/confirmation-drawer/confirmation-drawer';
import { PartyShareDrawerComponent } from '../../drawer/party-share-drawer/party-share-drawer.component';
import { GamePausedDrawerComponent } from '../../drawer/game-paused-drawer/game-paused-drawer.component';
import { QrScannerDrawer } from '../../drawer/qr-scanner-drawer/qr-scanner-drawer';
import { NewParticipantDrawerComponent } from '../../drawer/new-participant-drawer/new-participant-drawer.component';
import { LobbyParticipantSettingsDrawer } from '../../drawer/lobby-participant-settings-drawer/lobby-participant-settings-drawer';
import { GamePausedData } from '../../drawer/game-paused-drawer/models/game-paused-data';
import { Player } from '../game/models/player';
import { LobbyParticipantDTO } from '../../../api-models/model/lobbyParticipantDTO';

const DRAWER_COMPONENTS: Type<unknown>[] = [
  PlayerOverviewDrawerComponent,
  ConfirmationDrawer,
  PartyShareDrawerComponent,
  GamePausedDrawerComponent,
  QrScannerDrawer,
  NewParticipantDrawerComponent,
  LobbyParticipantSettingsDrawer,
];

describe('DrawerService', () => {
  const gamePausedData: GamePausedData = {
    currentRound: 3,
    currentPlayer: Player.fromPlayerDto(aPlayerDto()),
    currentPauseTime: 1_000,
    elapsedGameTime: 60_000,
    cardsLeft: 30,
    partyId: PARTY_ID,
  };
  const participant = { id: 'participant-1', name: 'Anna' } as LobbyParticipantDTO;

  let service: DrawerService;
  let openOverlay: ReturnType<typeof vi.spyOn>;

  function configure(isHandset: boolean): void {
    expect(document.querySelectorAll('.cdk-overlay-pane')).toHaveLength(0);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: BreakpointObserver,
          useValue: { observe: () => of({ matches: isHandset, breakpoints: {} }) },
        },
        { provide: GameService, useValue: {} },
        { provide: LobbyService, useValue: { participants: () => [] } },
        { provide: ToastService, useValue: createToastServiceStub() },
      ],
    });

    // The drawers' own templates are covered by their specs; here they only need to mount.
    for (const component of DRAWER_COMPONENTS) {
      TestBed.overrideComponent(component, {
        set: {
          template: '<div class="drawer-stub"></div>',
          templateUrl: undefined,
          imports: [],
          styles: [],
          styleUrl: undefined,
          styleUrls: undefined,
        },
      });
    }

    openOverlay = vi.spyOn(TestBed.inject(OverlayService), 'openOverlay');
    service = TestBed.inject(DrawerService);
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function panes(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>('.cdk-overlay-pane'));
  }

  function backdrop(): HTMLElement | null {
    return document.querySelector<HTMLElement>('.cdk-overlay-backdrop');
  }

  function drawerElement(): HTMLElement {
    return panes()[0].firstElementChild as HTMLElement;
  }

  function injectedHandle(): OverlayHandle<unknown> {
    const ng = (
      window as unknown as {
        ng: { getInjector: (el: Element) => { get: <T>(token: unknown) => T } };
      }
    ).ng;
    return ng.getInjector(drawerElement()).get<OverlayHandle<unknown>>(OverlayHandle);
  }

  describe('regular screens', () => {
    beforeEach(() => {
      configure(false);
    });

    describe.each([
      [
        'showPlayerOverviewDrawer',
        PlayerOverviewDrawerComponent,
        () => service.showPlayerOverviewDrawer(),
        undefined,
      ],
      [
        'showConfirmationDrawer',
        ConfirmationDrawer,
        () => service.showConfirmationDrawer('Anna'),
        'Anna',
      ],
      [
        'showPartyShareDrawer',
        PartyShareDrawerComponent,
        () => service.showPartyShareDrawer(PARTY_ID),
        PARTY_ID,
      ],
      [
        'showGamePausedDrawer',
        GamePausedDrawerComponent,
        () => service.showGamePausedDrawer(gamePausedData),
        gamePausedData,
      ],
      ['showQrScanner', QrScannerDrawer, () => service.showQrScanner(), undefined],
      [
        'showNewParticipantDrawer',
        NewParticipantDrawerComponent,
        () => service.showNewParticipantDrawer(),
        undefined,
      ],
      [
        'showLobbyParticipantSettingsDrawer',
        LobbyParticipantSettingsDrawer,
        () => service.showLobbyParticipantSettingsDrawer(participant),
        participant,
      ],
    ] as [string, Type<unknown>, () => unknown, unknown][])(
      '%s',
      (_name, component, open, data) => {
        it('opens its drawer component with the given data', () => {
          // Arrange
          const expected = data === undefined ? { component } : { component, data };

          // Act
          open();

          // Assert
          expect(openOverlay).toHaveBeenCalledExactlyOnceWith(expect.objectContaining(expected));
          expect(panes()).toHaveLength(1);
          expect(drawerElement().querySelector('.drawer-stub')).not.toBeNull();
        });

        it('renders as a centred drawer pane over a drawer backdrop', () => {
          // Arrange
          const expectedClasses = ['drawer-pane'];

          // Act
          open();
          TestBed.tick();

          // Assert
          expect([...drawerElement().classList].filter((c) => c.startsWith('drawer-pane'))).toEqual(
            expectedClasses,
          );
          expect(backdrop()?.classList).toContain('drawer-backdrop');
          expect(panes()[0].parentElement?.style.alignItems).toBe('center');
        });
      },
    );

    describe.each([
      ['showQrScanner', () => service.showQrScanner()],
      ['showNewParticipantDrawer', () => service.showNewParticipantDrawer()],
      ['showGamePausedDrawer', () => service.showGamePausedDrawer(gamePausedData)],
      [
        'showLobbyParticipantSettingsDrawer',
        () => service.showLobbyParticipantSettingsDrawer(participant),
      ],
    ] as [string, () => OverlayHandle<unknown>][])('%s handle', (_name, open) => {
      it('returns the handle the drawer component closes', async () => {
        // Arrange
        const handle = open();
        const drawerHandle = injectedHandle();

        // Act
        await drawerHandle.close('result');

        // Assert
        expect(drawerHandle).toBe(handle);
        await expect(handle.closed).resolves.toBe('result');
        expect(panes()).toHaveLength(0);
      });
    });

    describe('backdrop click', () => {
      it.each([
        ['showPlayerOverviewDrawer', () => service.showPlayerOverviewDrawer()],
        ['showConfirmationDrawer', () => service.showConfirmationDrawer('Anna')],
        ['showPartyShareDrawer', () => service.showPartyShareDrawer(PARTY_ID)],
        ['showNewParticipantDrawer', () => service.showNewParticipantDrawer()],
        [
          'showLobbyParticipantSettingsDrawer',
          () => service.showLobbyParticipantSettingsDrawer(participant),
        ],
      ])('closes the %s', async (_name, open) => {
        // Arrange
        open();

        // Act
        backdrop()!.click();
        await flushMicrotasks();

        // Assert
        expect(panes()).toHaveLength(0);
      });

      it.each([
        ['showGamePausedDrawer', () => service.showGamePausedDrawer(gamePausedData)],
        ['showQrScanner', () => service.showQrScanner()],
      ])('keeps the %s open', async (_name, open) => {
        // Arrange
        open();

        // Act
        backdrop()!.click();
        await flushMicrotasks();

        // Assert
        expect(panes()).toHaveLength(1);
      });
    });
  });

  describe('handset screens', () => {
    beforeEach(() => {
      configure(true);
    });

    it('marks the drawer pane as compact', () => {
      // Arrange
      const expectedClasses = ['drawer-pane', 'drawer-pane--compact'];

      // Act
      service.showConfirmationDrawer('Anna');

      // Assert
      expect(openOverlay).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ componentClasses: expectedClasses }),
      );
      expect(drawerElement().classList).toContain('drawer-pane--compact');
    });

    it('docks the drawer to the bottom of the screen', () => {
      // Arrange
      const participantId = 'Anna';

      // Act
      service.showConfirmationDrawer(participantId);
      TestBed.tick();

      // Assert
      expect(panes()[0].parentElement?.style.alignItems).toBe('flex-end');
      expect(panes()[0].parentElement?.style.justifyContent).toBe('center');
    });
  });
});
