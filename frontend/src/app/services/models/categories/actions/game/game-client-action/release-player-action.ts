import {GameAction} from '../game-action';

interface ReleasePlayerAction extends GameAction {
  playerId: string;
}

export function releasePlayerAction(playerId: string): ReleasePlayerAction {
  return {type: 'RELEASE_PLAYER', playerId: playerId};
}
