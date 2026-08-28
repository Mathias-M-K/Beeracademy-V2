import {PartyState} from '../../../api-models/model/partyState';

export interface PartyInfo {
  partyId: string;
  partyName: string;
  nrOfParticipants: number;
  partyType: PartyState;
}

export function partyInfo(partyId: string, partyName: string | undefined, nrOfParticipants: number | undefined, partyState: PartyState): PartyInfo {
  return {
    partyName: partyName ?? 'unknown',
    partyId,
    partyType: partyState,
    nrOfParticipants: nrOfParticipants ?? 0
  }
}


