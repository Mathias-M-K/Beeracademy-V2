import {IdentityEvent} from './categories/events/common/identity-event';
import {Role} from '../../../api-models/model/role';

export interface Identity {
  id: string;
  role: Role;
}

export function identifyFromEvent(identityEvent: IdentityEvent): Identity {
  return {id: identityEvent.id, role: identityEvent.role};
}
