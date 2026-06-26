import {LobbyClientAction} from './lobby-client-action';

interface NewPlayerAction extends LobbyClientAction {
  name: string;
}

export function newPlayerAction(name: string): NewPlayerAction {
  return {type: 'CREATE_PARTICIPANT', name};
}
