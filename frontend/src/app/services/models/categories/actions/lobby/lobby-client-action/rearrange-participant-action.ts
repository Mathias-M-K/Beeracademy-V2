import {ParticipantPosition} from '../../../../../../../api-models/model/participantPosition';
import {LobbyAction} from '../lobby-action';

interface RearrangeParticipantAction extends LobbyAction {
  positions: ParticipantPosition[];
}

export function rearrangeParticipantAction(positions: ParticipantPosition[]) : RearrangeParticipantAction {
  return {type: "REARRANGE_PARTICIPANTS", positions: positions};
}
