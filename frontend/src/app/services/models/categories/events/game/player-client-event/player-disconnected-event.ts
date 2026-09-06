import {GameEvent} from '../game-event';

export interface PlayerDisconnectedEvent extends GameEvent {
  playerId: string
}
