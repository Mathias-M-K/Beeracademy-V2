import {AchievementDetector} from '../models/achievement-detector';
import {Player} from '../../game/models/player';

export const fastestAverageTurn: AchievementDetector = ({turns}) => {
  const timePerPlayer = new Map<string, {player: Player; totalMillis: number; turns: number}>();
  for (const turn of turns) {
    const millis = turn.info.durationInMillis ?? 0;
    // The first round is untimed, so its turns are recorded as 0 ms.
    if (millis <= 0) continue;

    const entry = timePerPlayer.get(turn.player.id) ?? {player: turn.player, totalMillis: 0, turns: 0};
    entry.totalMillis += millis;
    entry.turns++;
    timePerPlayer.set(turn.player.id, entry);
  }

  const ranked = [...timePerPlayer.values()]
    .map(({player, totalMillis, turns}) => ({player, seconds: totalMillis / turns / 1000}))
    .sort((a, b) => a.seconds - b.seconds);

  if (ranked.length === 0) return undefined;

  const [winner, ...runnerUps] = ranked.slice(0, 3);
  const secondPlace = runnerUps[0];

  return {
    title: 'Hurtigste snit-tid',
    additionalInfo: secondPlace
      ? `${(secondPlace.seconds - winner.seconds).toFixed(2)} s hurtigere end ${secondPlace.player.name}`
      : '',
    unit: 's',
    player: winner.player,
    value: winner.seconds,
    runnerUps: runnerUps.map(({player, seconds}) => ({player, value: seconds})),
  };
};
