import { AchievementDetector } from '../models/achievement-detector';
import { Player } from '../../game/models/player';

export const noChugs: AchievementDetector = ({ turns, chugs }) => {
  const chuggers = new Set(chugs.map((chug) => chug.player.id));

  const turnsPerPlayer = new Map<string, { player: Player; turns: number }>();
  for (const turn of turns) {
    if (chuggers.has(turn.player.id)) continue;

    const entry = turnsPerPlayer.get(turn.player.id) ?? { player: turn.player, turns: 0 };
    entry.turns++;
    turnsPerPlayer.set(turn.player.id, entry);
  }

  // Of the players who never chugged, the one who drew the most cards dodged the most aces.
  const ranked = [...turnsPerPlayer.values()].sort((a, b) => b.turns - a.turns);

  if (ranked.length === 0) return undefined;

  const [winner, ...runnerUps] = ranked.slice(0, 3);

  return {
    title: 'Ingen bundere',
    additionalInfo: `${winner.turns} kort - men intet es`,
    unit: 'bundere',
    digitsInfo: '1.0-2',
    player: winner.player,
    value: 0,
    runnerUps: runnerUps.map(({ player }) => ({ player, value: 0 })),
  };
};
