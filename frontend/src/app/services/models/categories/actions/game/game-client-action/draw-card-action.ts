import {GameAction} from '../game-action';

interface DrawCardAction extends GameAction {
  duration: number;
}

export function drawCardAction(duration: number): DrawCardAction {
  return {type: 'DRAW_CARD', duration: duration}
}
