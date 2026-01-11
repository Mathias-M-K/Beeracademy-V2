import {GameClientAction} from './game-client-action';
import {Suit} from '../../../../../api-models/model/suit';

export interface ChugAction extends GameClientAction {
  duration: number;
  suit: Suit;
  playerId: string;
}
