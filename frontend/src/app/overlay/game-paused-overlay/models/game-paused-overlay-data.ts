import {Player} from '../../../services/game/models/player';
import {Role} from '../../../../api-models/model/role';

export interface GamePausedOverlayData{
  role: Role
  currentPlayer: Player;
  time: number;
}
