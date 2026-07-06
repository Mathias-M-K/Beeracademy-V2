import {GameAction} from '../game-action';

interface PauseGameAction extends GameAction {}

export function pauseGameAction(): PauseGameAction {
  return {type: 'PAUSE_GAME'};
}
