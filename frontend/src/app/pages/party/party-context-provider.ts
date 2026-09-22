export interface PartyContext {
  partyName: string;
  partyId: string;
  isHost: boolean;
}

export interface PartyContextProvider {
  getContext(): PartyContext;
}
