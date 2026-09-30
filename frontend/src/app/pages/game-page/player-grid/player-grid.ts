import { Component, input, inject } from '@angular/core';
import { PlayerCard } from './player-card/player-card';
import { Player } from '../../../services/game/models/player';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'app-player-grid',
  imports: [PlayerCard],
  templateUrl: './player-grid.html',
  styleUrl: './player-grid.scss',
})
export class PlayerGrid {
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly players = input.required<Player[] | undefined>();
  readonly activePlayerId = input<string>();

  protected readonly isCompact = toSignal(
    this.breakpointObserver.observe('(max-width: 500px)').pipe(map((result) => result.matches)),
    { initialValue: false },
  );
}
