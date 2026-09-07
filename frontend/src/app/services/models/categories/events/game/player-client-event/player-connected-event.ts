import {GameEvent} from '../game-event';

export interface PlayerConnectedEvent extends GameEvent {
  playerId: string
}
