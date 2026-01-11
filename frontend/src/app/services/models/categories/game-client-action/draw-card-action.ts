import {GameClientAction} from './game-client-action';

export interface DrawCardAction extends GameClientAction {
  duration: number;
}
