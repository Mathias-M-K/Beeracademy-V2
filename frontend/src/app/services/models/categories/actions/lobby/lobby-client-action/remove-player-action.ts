import {LobbyAction} from '../lobby-action';

interface RemovePlayerAction extends LobbyAction {
  participantId: string;
}
export function removePlayerAction(participantId: string): RemovePlayerAction  {
  return {type:'REMOVE_PARTICIPANT',participantId:participantId}
}
