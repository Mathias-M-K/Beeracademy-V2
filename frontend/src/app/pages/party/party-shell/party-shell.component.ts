import { Component, computed, effect, inject, Signal, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { GameTimeFormatPipe } from '../../../pipes/game-time-format-pipe';
import { MaterialIcon } from '../../../common/components/material-icon/material-icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { GameService } from '../../../services/game/game.service';
import { TimerService } from '../../../services/timer-service/timer.service';
import { TimerType } from '../../../services/timer-service/models/TimerType';
import { DrawerService } from '../../../services/drawer/drawer.service';
import { LobbyService } from '../../../services/lobby/lobby.service';
import { PartyContextProvider } from '../party-context-provider';
import { TimerState } from '../../../../api-models/model/timerState';

interface Round {
  completed: boolean;
  isCurrent: boolean;
}

@Component({
  imports: [RouterOutlet, GameTimeFormatPipe, MaterialIcon],
  selector: 'app-party-shell',
  styleUrl: './party-shell.component.scss',
  templateUrl: './party-shell.component.html',
  host: {
    '[style.--progress.%]': 'roundProgress()',
    '[class.is-lobby]': 'phase() === "lobby"',
  },
})
export class PartyShellComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly gameService = inject(GameService);
  private readonly lobbyService = inject(LobbyService);
  private readonly gameTimer = inject(TimerService).getTimer(TimerType.GAME);
  private readonly drawerService = inject(DrawerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected partyName = signal<string>('');
  protected partyId = signal<string>('');
  protected isHost = signal<boolean>(false);

  protected gameDuration = this.gameTimer.currentDuration;
  protected currentRound = this.gameService.currentRound;
  protected roundProgress = computed(() => (100 / 13) * this.currentRound());
  protected timerState = computed(
    () => this.gameService.gameTimeReport()?.state ?? TimerState.NotStarted,
  );

  protected readonly phase: Signal<'lobby' | 'game' | undefined> = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.currentPhase()),
    ),
    { initialValue: this.currentPhase() },
  );
  protected readonly isGamePhase = computed(() => this.phase() === 'game');
  protected readonly isLobbyPhase = computed(() => this.phase() === 'lobby');

  constructor() {
    effect(() => {
      const contextProvider: PartyContextProvider =
        this.phase() === 'lobby' ? this.lobbyService : this.gameService;
      const context = contextProvider.getContext();

      this.partyName.set(context.partyName);
      this.partyId.set(context.partyId);
      this.isHost.set(context.isHost);
    });
  }

  protected roundIndicator = computed(() => {
    const rounds: Round[] = [];
    for (let i = 1; i <= 13; ++i) {
      if (i < this.currentRound()) {
        rounds.push({ completed: true, isCurrent: false });
      } else if (i === this.currentRound()) {
        rounds.push({ completed: false, isCurrent: true });
      } else {
        rounds.push({ completed: false, isCurrent: false });
      }
    }
    return rounds;
  });

  protected readonly isCompact = toSignal(
    this.breakpointObserver.observe('(max-width: 650px)').pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  protected pauseGame() {
    this.gameService.dispatchPauseGameAction();
  }

  protected resumeGame() {
    this.gameService.dispatchResumeGameAction();
  }

  protected showPlayers() {
    this.drawerService.showPlayerOverviewDrawer();
  }

  protected showSharePanel() {
    const partyId = this.partyId();
    if (!partyId) return;
    this.drawerService.showPartyShareDrawer(partyId);
  }

  protected readonly TimerState = TimerState;

  private currentPhase(): 'lobby' | 'game' | undefined {
    return this.route.snapshot.firstChild?.data['phase'];
  }
}
