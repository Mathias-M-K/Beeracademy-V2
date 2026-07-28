import {Component, input} from '@angular/core';
import {PlayerCard} from './player-card/player-card';
import {Player} from '../../../services/game/models/player';
import {DotIndicator} from '../../../common/dot-indicator/dot-indicator';

@Component({
  selector: 'app-player-grid',
  imports: [
    PlayerCard,
    DotIndicator
  ],
  templateUrl: './player-grid.html',
  styleUrl: './player-grid.scss',
})
export class PlayerGrid {

  readonly players = input.required<Player[] | undefined>();
}
