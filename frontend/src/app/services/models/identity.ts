import {IdentityEvent} from './categories/events/common/identity-event';

export interface Identity {
  id: string;
  role: string;
}

export function identifyFromEvent(identityEvent: IdentityEvent): Identity {
  return {id: identityEvent.id, role: identityEvent.role};
}
