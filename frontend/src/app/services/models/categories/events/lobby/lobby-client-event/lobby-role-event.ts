import {LobbyClientEvent} from './lobby-client-event';
import {Role} from '../../../../../../../api-models/model/role';

export interface LobbyRoleEvent extends LobbyClientEvent {
  role: Role;
}
