import {LobbyIdentityEvent} from './categories/events/lobby/common/lobby-identity-event';

export interface Identity {
  id: string;
  role: string;
}

export function identifyFromEvent(identityEvent: LobbyIdentityEvent): Identity {
  return {id: identityEvent.id, role: identityEvent.role};
}
