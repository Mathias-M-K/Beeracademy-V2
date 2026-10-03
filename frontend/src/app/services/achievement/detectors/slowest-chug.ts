import {AchievementDetector} from '../models/achievement-detector';
import {PlayerChug} from '../../game/models/playerChug';
import {firstPerPlayer} from './first-per-player';

const chugSeconds = (chug: PlayerChug) => chug.chug.chugTimeMillis! / 1000;

export const slowestChug: AchievementDetector = ({chugs}) => {
  const timed = chugs
    .filter(chug => chug.chug.chugTimeMillis !== undefined)
    .sort((a, b) => b.chug.chugTimeMillis! - a.chug.chugTimeMillis!);
  const worstPerPlayer = firstPerPlayer(timed);

  if (worstPerPlayer.length === 0) return undefined;

  const [winner, ...runnerUps] = worstPerPlayer.slice(0, 3);
  const secondPlace = runnerUps[0];

  return {
    title: 'Langsomste bunde-tid',
    additionalInfo: secondPlace
      ? `${(chugSeconds(winner) - chugSeconds(secondPlace)).toFixed(2)} s langsommere end ${secondPlace.player.name}`
      : '',
    unit: 's',
    digitsInfo: '1.1-2',
    player: winner.player,
    value: chugSeconds(winner),
    runnerUps: runnerUps.map(chug => ({player: chug.player, value: chugSeconds(chug)})),
  };
};
