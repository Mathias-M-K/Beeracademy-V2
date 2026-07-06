import {GameAction} from '../game-action';

interface StartGameAction extends GameAction {

}

export function startGameAction(): StartGameAction {
  return {type: 'START_GAME'};
}


