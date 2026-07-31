import {Player} from '../../../services/game/models/player';

export interface ChugOverlayData{
  players: Player[];
  playerToChug: Player;
  isGameClient: boolean;
}
