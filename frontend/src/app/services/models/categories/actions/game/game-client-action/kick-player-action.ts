import {GameAction} from '../game-action';

interface KickPlayerAction extends GameAction {
  playerId: string;
  reason: string;
}

export function kickPlayerAction(playerId: string, reason: string): KickPlayerAction {
  return {type: 'KICK_PLAYER', playerId, reason}
}
