import {GameClientAction} from './game-client-action';
import {Chug} from '../../../../../api-models/model/chug';

export interface ChugAction extends GameClientAction {
  chug: Chug;
}
