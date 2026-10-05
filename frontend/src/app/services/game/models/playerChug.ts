import { Chug } from '../../../../api-models/model/chug';
import { Player } from './player';

export interface PlayerChug {
  player: Player;
  chug: Chug;

  placement?: number;
  chugNumber: number;
}
