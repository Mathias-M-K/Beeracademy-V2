
import {Role} from '../../../../../../../api-models/model/role';
import {LobbyEvent} from '../lobby-event';

export interface LobbyIdentityEvent extends LobbyEvent {
  role: Role;
  id: string;
}
