import {Player} from '../../../services/game/models/player';

export interface GamePausedData {
  currentRound: number;
  currentPlayer: Player;
  currentPauseTime: number;
  elapsedGameTime: number;
  cardsLeft: number;
  partyId: string;
}
