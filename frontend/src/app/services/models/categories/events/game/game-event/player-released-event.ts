import {GameEvent} from '../game-event';

export interface PlayerReleasedEvent extends GameEvent {
  playerId: string
}
