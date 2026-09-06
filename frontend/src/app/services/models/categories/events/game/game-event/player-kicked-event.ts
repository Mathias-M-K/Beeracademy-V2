import {GameEvent} from '../game-event';

export interface PlayerKickedEvent extends GameEvent {
  playerId: string;
  reason: string
}
