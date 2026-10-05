import { PlayerChug } from '../../game/models/playerChug';

/** Only for chugs already filtered to those with a recorded time. */
export const chugSeconds = (chug: PlayerChug) => chug.chug.chugTimeMillis! / 1000;
