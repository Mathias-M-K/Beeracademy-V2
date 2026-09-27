import {Turn} from '../../../../api-models/model/turn';
import {Player} from './player';

export interface PlayerTurn{
  info: Turn;
  player: Player;
}
