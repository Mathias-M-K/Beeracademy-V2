import {GameEvent} from '../game-event';

export interface PlayerReleaseRequestedEvent extends GameEvent{
  playerId: string;
}
