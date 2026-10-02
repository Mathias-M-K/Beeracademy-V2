import {AchievementDetector} from '../models/achievement-detector';
import {Player} from '../../game/models/player';

interface PlayerBeers {
  player: Player;
  beers: number;
}

export const mostBeers: AchievementDetector = ({turns}) => {
  const sipsPerPlayer = new Map<string, { player: Player; sips: number }>();
  for (const turn of turns) {
    const entry = sipsPerPlayer.get(turn.player.id) ?? {player: turn.player, sips: 0};
    entry.sips += turn.info.card?.rank ?? 0;
    sipsPerPlayer.set(turn.player.id, entry);
  }

  const ranked: PlayerBeers[] = [...sipsPerPlayer.values()]
    .map(({player, sips}) => ({player, beers: sips / player.sipsInABeer}))
    .sort((a, b) => b.beers - a.beers);

  if (ranked.length === 0) return undefined;

  const [winner, ...runnerUps] = ranked.slice(0, 3);

  const secondPlace = runnerUps[0];
  const additionalInfo = secondPlace ? `${(winner.beers - secondPlace.beers)} øl mere end ${secondPlace.player.name}` : '';


  return {
    title: 'Flest øl',
    additionalInfo: additionalInfo,
    unit: 'øl',
    player: winner.player,
    value: winner.beers,
    runnerUps: runnerUps.map(({player, beers}) => ({player, value: beers})),
  };
};
