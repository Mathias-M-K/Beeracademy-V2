import {LobbyAction} from '../lobby-action';

interface UpdateParticipantSettingsAction extends LobbyAction{
  sipsInABeer: number;
  canDrawAce: boolean;
  behalfOf?: string
}

export function changeParticipantSettingsAction(sipsInABeer: number, canDrawAce: boolean, behalfOf?: string): UpdateParticipantSettingsAction{
  return {type: 'UPDATE_SETTINGS', sipsInABeer, canDrawAce, behalfOf};
}
