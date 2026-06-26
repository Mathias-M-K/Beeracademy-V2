import {computed, inject, Injectable, linkedSignal, signal} from '@angular/core';
import {LobbyWebsocketService} from './lobby-websocket.service';
import {LobbyDTO} from '../../api-models/model/lobbyDTO';
import {WebsocketEnvelope} from './models/websocket-envelope';
import {LobbyStateEvent} from './models/categories/events/lobby/common/lobby-state-event';
import {Role} from '../../api-models/model/role';
import {LobbyRoleEvent} from './models/categories/events/lobby/common/lobby-role-event';
import {newPlayerAction} from './models/categories/actions/lobby/lobby-client-action/new-player-action';
import {LobbyClientAction} from './models/categories/actions/lobby/lobby-client-action/lobby-client-action';
import {lobbyClientActionEnvelope} from './models/categories/actions/lobby/lobby-client-action/lobby-client-action-envelope';
import {NewParticipantEvent} from './models/categories/events/lobby/common/new-participant-event';
import {
  ParticipantDisconnectedEvent
} from './models/categories/events/lobby/lobby-participant-event/participant-disconnected-event';
import {removePlayerAction} from './models/categories/actions/lobby/lobby-client-action/remove-player-action';
import {ParticipantRemovedEvent} from './models/categories/events/lobby/lobby-client-event/participant-removed-event';
import {LobbyEventEnvelope} from './models/categories/events/lobby/lobby-event-envelope';

@Injectable({
  providedIn: 'root',
})
export class LobbyService {

  private readonly lobbyWebsocket: LobbyWebsocketService = inject(LobbyWebsocketService);

  public readonly websocketConnectionStatus = this.lobbyWebsocket.connectionStatus;

  private readonly lobbyState$ = signal<LobbyDTO | undefined>(undefined);

  public readonly title = computed(()=>this.lobbyState$()?.name);
  public readonly lobbyId = computed(()=>this.lobbyState$()?.id);
  private readonly _participants = linkedSignal(()=>this.lobbyState$()?.participants ?? []);
  public readonly participants = this._participants.asReadonly();

  private readonly _role = signal<Role | undefined>(undefined);
  public readonly role = this._role.asReadonly();

  constructor() {
    this.lobbyWebsocket.messages$.subscribe({
      next: msg => this.handleWebsocketMessage(msg)
    })
  }

  public connectToWebsocket(): void {
    this.lobbyWebsocket.connectToWebsocket();
  }

  private handleWebsocketMessage(msg: WebsocketEnvelope) {

    const supportedEventCategories: string[] = ['LOBBY_CLIENT_EVENT','LOBBY_PARTICIPANT_EVENT'];

    if(!supportedEventCategories.includes(msg.category)){
      console.error("Can't handle message", msg);
    }

    const event: LobbyEventEnvelope = msg as LobbyEventEnvelope;

    switch (event.payload.type) {
      case "HELLO_LOBBY_SNAPSHOT" : return this.handleHelloLobbySnapshotEvent(event);
      case "HELLO_LOBBY_ROLE" : return this.handleHelloLobbyRoleEvent(event);
      case "NEW_PARTICIPANT" : return this.handleNewParticipantEvent(event);
      case "PARTICIPANT_REMOVED" : {
        const participantRemovedEvent = event.payload as ParticipantRemovedEvent;
        this.removeParticipant(participantRemovedEvent.participantId);
        break;
      }
      case "PARTICIPANT_DISCONNECTED" : {
        const participantDisconnectedEvent: ParticipantDisconnectedEvent = event.payload as ParticipantDisconnectedEvent;
        this.removeParticipant(participantDisconnectedEvent.participantId)
      }
    }
  }

  private handleNewParticipantEvent(event: LobbyEventEnvelope){
    const newParticipantEvent: NewParticipantEvent = event.payload as NewParticipantEvent;
    this.addParticipant(newParticipantEvent.participant);
  }

  private handleHelloLobbySnapshotEvent(event: LobbyEventEnvelope) {
    const lobbyStateExchangeEvent = event.payload as LobbyStateEvent;
    this.lobbyState$.set(lobbyStateExchangeEvent.lobby)
  }

  private handleHelloLobbyRoleEvent(event: LobbyEventEnvelope) {
    const lobbyRoleEvent = event.payload as LobbyRoleEvent;
    this._role.set(lobbyRoleEvent.role);
  }

  public requestParticipantCreation(name: string): void {
    this.sendLobbyAction(newPlayerAction(name));
  }
  public requestParticipantRemoval(participantId: string): void {
    this.sendLobbyAction(removePlayerAction(participantId))
  }

  private sendLobbyAction(action: LobbyClientAction): void {
    this.lobbyWebsocket.send(lobbyClientActionEnvelope(action));
  }

  public addParticipant(newParticipant: LobbyDTO): void {
    this._participants.update(current => [...current, newParticipant]);
  }

  public removeParticipant(participantId: string): void {
    this._participants.update(current => [...current.filter(participant => participant.id !== participantId)]);
  }

  public leaveLobby(){
    this.lobbyWebsocket.disconnect();
  }
}
