import { Achievement } from './achievement';
import { PlayerTurn } from '../../game/models/playerTurn';
import { PlayerChug } from '../../game/models/playerChug';

export interface GameEvents {
  turns: PlayerTurn[];
  chugs: PlayerChug[];
}

export type AchievementDetector = (eventData: GameEvents) => Achievement | undefined;
