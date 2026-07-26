
import {Role} from '../../../../../../api-models/model/role';
import {LobbyEvent} from '../lobby/lobby-event';

export interface IdentityEvent extends LobbyEvent {
  role: Role;
  id: string;
}
