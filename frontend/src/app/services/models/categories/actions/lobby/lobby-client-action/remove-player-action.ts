import {LobbyClientAction} from './lobby-client-action';

interface RemovePlayerAction extends LobbyClientAction {
  participantId: string;
  kickReason: string
}
export function removePlayerAction(participantId: string): RemovePlayerAction  {
  return {type:'KICK_PARTICIPANT',participantId:participantId, kickReason:'Removed by owner'}
}
