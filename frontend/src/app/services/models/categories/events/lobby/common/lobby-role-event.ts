
import {Role} from '../../../../../../../api-models/model/role';
import {LobbyEvent} from '../lobby-event';

export interface LobbyRoleEvent extends LobbyEvent {
  role: Role;
}
