import {Player} from '../../game/models/player';

export interface AchievementRunnerUp {
  player: Player;
  value: number;
}

export interface Achievement {
  title: string;
  additionalInfo: string
  unit: string;

  player: Player;
  value: number;

  runnerUps: AchievementRunnerUp[];
}
