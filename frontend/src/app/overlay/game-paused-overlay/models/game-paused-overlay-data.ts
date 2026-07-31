import {Player} from '../../../services/game/models/player';

export interface GamePausedOverlayData{
  isGameClient: boolean;
  currentPlayer: Player;
  time: number;
}
