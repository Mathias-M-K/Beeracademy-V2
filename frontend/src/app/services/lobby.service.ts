import {computed, inject, Injectable, linkedSignal, signal} from '@angular/core';
import {LobbyWebsocketService} from './lobby-websocket.service';
import {LobbyDTO} from '../../api-models/model/lobbyDTO';
import {WebsocketEnvelope} from './models/websocket-envelope';
import {LobbyClientEventEnvelope} from './models/categories/events/lobby/lobby-client-event/lobby-client-event-envelope';
import {LobbyStateEvent} from './models/categories/events/lobby/lobby-client-event/lobby-state-event';
import {Role} from '../../api-models/model/role';
import {LobbyRoleEvent} from './models/categories/events/lobby/lobby-client-event/lobby-role-event';
import {newPlayerAction} from './models/categories/actions/lobby/lobby-client-action/new-player-action';
import {LobbyClientAction} from './models/categories/actions/lobby/lobby-client-action/lobby-client-action';
import {lobbyClientActionEnvelope} from './models/categories/actions/lobby/lobby-client-action/lobby-client-action-envelope';
import {NewParticipantEvent} from './models/categories/events/lobby/common/new-participant-event';
import {
  LobbyParticipantEventEnvelope
} from './models/categories/events/lobby/lobby-participant-event/lobby-participant-event-envelope';
import {
  ParticipantDisconnectedEvent
} from './models/categories/events/lobby/lobby-participant-event/participant-disconnected-event';
import {removePlayerAction} from './models/categories/actions/lobby/lobby-client-action/remove-player-action';
import {ParticipantKickedEvent} from './models/categories/events/lobby/lobby-client-event/participant-kicked-event';

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

    switch (msg.category) {
      case 'LOBBY_CLIENT_EVENT': {
        this.handleLobbyClientEvent(msg as LobbyClientEventEnvelope);
        break
      }
      case 'LOBBY_PARTICIPANT_EVENT': {
        this.handleLobbyParticipantEvent(msg as LobbyParticipantEventEnvelope);
        break
      }
      default: console.error("Can't handle message",msg);
    }
  }

  private handleLobbyClientEvent(event: LobbyClientEventEnvelope): void {

    console.log("Handling Lobby client event", event);

    switch (event.payload.type){
      case "HELLO_LOBBY_SNAPSHOT" : {
        this.handleHelloLobbySnapshotEvent(event);
        break;
      }
      case "HELLO_LOBBY_ROLE" : {
        this.handleHelloLobbyRoleEvent(event);
        break;
      }
      case "NEW_PARTICIPANT" : {
        const newParticipantEvent: NewParticipantEvent = event.payload as NewParticipantEvent;
        this.addParticipant(newParticipantEvent.participant)
        break;
      }
      case "PARTICIPANT_KICKED" : {
        const participantKickedEvent = event.payload as ParticipantKickedEvent;
        this.removeParticipant(participantKickedEvent.participantId);
      }
    }
  }

  private handleLobbyParticipantEvent(event: LobbyParticipantEventEnvelope): void {

    console.log("Handling LobbyParticipant event", event);

    switch (event.payload.type) {
      case "NEW_PARTICIPANT" : {
        const newParticipantEvent: NewParticipantEvent = event.payload as NewParticipantEvent;
        this.addParticipant(newParticipantEvent.participant)
        break
      }
      case "HELLO_LOBBY_SNAPSHOT" : {
        this.handleHelloLobbySnapshotEvent(event);
        break;
      }
      case "HELLO_LOBBY_ROLE" : {
        this.handleHelloLobbyRoleEvent(event);
        break;
      }
      case "PARTICIPANT_DISCONNECTED" : {
        const participantLeavesEvent: ParticipantDisconnectedEvent = event.payload as ParticipantDisconnectedEvent;
        this.removeParticipant(participantLeavesEvent.participantId)
      }
    }
  }

  private handleHelloLobbySnapshotEvent(msg: WebsocketEnvelope) {
    const event = msg as LobbyClientEventEnvelope;
    const lobbyStateExchangeEvent = event.payload as LobbyStateEvent;
    this.lobbyState$.set(lobbyStateExchangeEvent.lobby)
  }

  private handleHelloLobbyRoleEvent(msg: WebsocketEnvelope) {
    const event = msg as LobbyClientEventEnvelope;
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




}
