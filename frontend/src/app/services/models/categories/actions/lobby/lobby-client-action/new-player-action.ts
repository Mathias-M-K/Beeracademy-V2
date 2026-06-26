import {LobbyAction} from '../lobby-action';

interface NewPlayerAction extends LobbyAction {
  name: string;
}

export function newPlayerAction(name: string): NewPlayerAction {
  return {type: 'CREATE_PARTICIPANT', name};
}
