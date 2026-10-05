import { AchievementDetector } from '../models/achievement-detector';
import { firstPerPlayer } from './first-per-player';
import { chugSeconds } from './chug-seconds';

export const fastestChug: AchievementDetector = ({ chugs }) => {
  const timed = chugs
    .filter((chug) => chug.chug.chugTimeMillis !== undefined)
    .sort((a, b) => chugSeconds(a) - chugSeconds(b));
  const bestPerPlayer = firstPerPlayer(timed);

  if (bestPerPlayer.length === 0) return undefined;

  const [winner, ...runnerUps] = bestPerPlayer.slice(0, 3);
  const secondPlace = runnerUps[0];

  return {
    title: 'Hurtigste bunde-tid',
    additionalInfo: secondPlace
      ? `${(chugSeconds(secondPlace) - chugSeconds(winner)).toFixed(2)} s hurtigere end ${secondPlace.player.name}`
      : '',
    unit: 's',
    digitsInfo: '1.1-2',
    player: winner.player,
    value: chugSeconds(winner),
    runnerUps: runnerUps.map((chug) => ({ player: chug.player, value: chugSeconds(chug) })),
  };
};
