import {Component, input} from '@angular/core';
import {PlayerCard} from './player-card/player-card';
import {PlayerDto} from '../../../../api-models/model/playerDto';
import {playerColor} from '../../../common/theme/player-colors';

@Component({
  selector: 'app-player-grid',
  imports: [
    PlayerCard
  ],
  templateUrl: './player-grid.html',
  styleUrl: './player-grid.scss',
})
export class PlayerGrid {

  readonly players = input.required<PlayerDto[] | undefined>();

  protected readonly playerColor = playerColor;
}
