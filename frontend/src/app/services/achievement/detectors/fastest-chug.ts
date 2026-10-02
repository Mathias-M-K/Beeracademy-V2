import {AchievementDetector} from '../models/achievement-detector';
import {PlayerChug} from '../../game/models/playerChug';

const chugSeconds = (chug: PlayerChug) => chug.chug.chugTimeMillis! / 1000;

export const fastestChug: AchievementDetector = ({chugs}) => {
  const bestPerPlayer = chugs
    .filter(chug => chug.chug.chugTimeMillis !== undefined)
    .sort((a, b) => a.chug.chugTimeMillis! - b.chug.chugTimeMillis!)
    .filter((chug, index, all) => all.findIndex(other => other.player.id === chug.player.id) === index);

  if (bestPerPlayer.length === 0) return undefined;

  const [winner, ...runnerUps] = bestPerPlayer.slice(0, 3);

  const secondPlace = runnerUps[0];
  const additionalInfo = secondPlace ? `${((secondPlace.chug.chugTimeMillis ?? 0) - (winner.chug.chugTimeMillis ?? 0))/1000} s hurtigere end ${secondPlace.player.name}` : '';

  return {
    title: 'Hurtigste bunde-tid',
    additionalInfo: additionalInfo,
    unit: 's',
    player: winner.player,
    value: chugSeconds(winner),
    runnerUps: runnerUps.map(chug => ({player: chug.player, value: chugSeconds(chug)})),
  };
};


