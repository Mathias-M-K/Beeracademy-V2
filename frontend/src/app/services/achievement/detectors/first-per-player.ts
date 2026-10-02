import {Player} from '../../game/models/player';

/** Keeps each player's first entry, so a list sorted best-first becomes each player's best. */
export const firstPerPlayer = <T extends {player: Player}>(sorted: T[]): T[] =>
  sorted.filter((entry, index) => sorted.findIndex(other => other.player.id === entry.player.id) === index);
