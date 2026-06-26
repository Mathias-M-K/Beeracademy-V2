import {LobbyClientAction} from './lobby-client-action';

interface RemovePlayerAction extends LobbyClientAction {
  participantId: string;
}
export function removePlayerAction(participantId: string): RemovePlayerAction  {
  return {type:'REMOVE_PARTICIPANT',participantId:participantId}
}
