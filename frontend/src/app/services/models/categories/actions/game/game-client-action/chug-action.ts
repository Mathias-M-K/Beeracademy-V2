import {GameAction} from '../game-action';
import {Chug} from '../../../../../../../api-models/model/chug';

interface ChugAction extends GameAction {
  chug: Chug;
}

export function chugAction(chug: Chug): ChugAction {
  return {type: 'REGISTER_CHUG', chug: chug}
}
