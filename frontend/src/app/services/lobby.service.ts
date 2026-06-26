import {computed, inject, Injectable, linkedSignal, signal} from '@angular/core';
import {LobbyWebsocketService} from './lobby-websocket.service';
import {LobbyDTO} from '../../api-models/model/lobbyDTO';
import {WebsocketEnvelope} from './models/websocket-envelope';
import {LobbyStateEvent} from './models/categories/events/lobby/common/lobby-state-event';
import {Role} from '../../api-models/model/role';
import {LobbyRoleEvent} from './models/categories/events/lobby/common/lobby-role-event';
import {newPlayerAction} from './models/categories/actions/lobby/lobby-client-action/new-player-action';
import {LobbyAction} from './models/categories/actions/lobby/lobby-action';
import {
  lobbyClientActionEnvelope,
  lobbyParticipantActionEnvelope
} from './models/categories/actions/lobby/lobby-action-envelope';
import {NewParticipantEvent} from './models/categories/events/lobby/common/new-participant-event';
import {
  ParticipantDisconnectedEvent
} from './models/categories/events/lobby/lobby-participant-event/participant-disconnected-event';
import {removePlayerAction} from './models/categories/actions/lobby/lobby-client-action/remove-player-action';
import {ParticipantRemovedEvent} from './models/categories/events/lobby/lobby-client-event/participant-removed-event';
import {LobbyEventEnvelope} from './models/categories/events/lobby/lobby-event-envelope';
import {sendMessageAction} from './models/categories/actions/lobby/lobby-participant-action/send-message-action';
import {Subject} from 'rxjs';
import {MessageInfo} from './chat/models/message-info';
import {NewMessageEvent} from './models/categories/events/lobby/common/new-message-event';
import {MessageDirection} from './chat/models/message-direction';
import {LobbyParticipantDTO} from '../../api-models/model/lobbyParticipantDTO';

@Injectable({
  providedIn: 'root',
})
export class LobbyService {

  private readonly lobbyWebsocket: LobbyWebsocketService = inject(LobbyWebsocketService);

  public readonly websocketConnectionStatus = this.lobbyWebsocket.connectionStatus;

  private readonly lobbyState$ = signal<LobbyDTO | undefined>(undefined);

  public readonly title = computed(() => this.lobbyState$()?.name);
  public readonly lobbyId = computed(() => this.lobbyState$()?.id);
  private readonly _participants = linkedSignal(() => this.lobbyState$()?.participants ?? []);
  public readonly participants = this._participants.asReadonly();

  private readonly _role = signal<Role | undefined>(undefined);
  public readonly role = this._role.asReadonly();

  private readonly _chatMessages = new Subject<MessageInfo>()
  public readonly chatMessages = this._chatMessages.asObservable();

  private readonly _lobbyReset = new Subject<void>()
  public readonly lobbyReset = this._lobbyReset.asObservable();

  constructor() {
    this.lobbyWebsocket.messages$.subscribe({
      next: msg => this.handleWebsocketMessage(msg)
    })
  }

  public connectToWebsocket(): void {
    this.lobbyWebsocket.connectToWebsocket();
  }

  private handleWebsocketMessage(msg: WebsocketEnvelope) {

    const supportedEventCategories: string[] = ['LOBBY_CLIENT_EVENT', 'LOBBY_PARTICIPANT_EVENT'];

    if (!supportedEventCategories.includes(msg.category)) {
      console.error("Can't handle message", msg);
      return;
    }

    console.log("Handling message", msg);

    const event: LobbyEventEnvelope = msg as LobbyEventEnvelope;

    switch (event.payload.type) {
      case "HELLO_LOBBY_SNAPSHOT" :
        return this.handleHelloLobbySnapshotEvent(event);
      case "HELLO_LOBBY_ROLE" :
        return this.handleHelloLobbyRoleEvent(event);
      case "NEW_PARTICIPANT" :
        return this.handleNewParticipantEvent(event);
      case "MESSAGE_SENT" :
        return this.handleNewMessageEvent(event);
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

  private handleNewMessageEvent(event: LobbyEventEnvelope) {
    const newMessageEvent: NewMessageEvent = event.payload as NewMessageEvent;

    let senderName = newMessageEvent.senderId === this.lobbyId() ?
      'Vært' :
      this.getParticipant(newMessageEvent.senderId)?.name;

    if(!senderName){
      console.error("Can't identify message owner", event);
      senderName = 'Unknown'
    }

    const messageInfo: MessageInfo = {direction: MessageDirection.IN, message: newMessageEvent.message, sender: senderName}
    console.log("Pushing message to queue", messageInfo)
    this._chatMessages.next(messageInfo)
  }
  private handleNewParticipantEvent(event: LobbyEventEnvelope) {
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

  private sendLobbyAction(action: LobbyAction): void {
    if (this.role() === Role.PlayerClient) {
      this.lobbyWebsocket.send(lobbyParticipantActionEnvelope(action));
    } else {
      this.lobbyWebsocket.send(lobbyClientActionEnvelope(action));
    }

  }

  public addParticipant(newParticipant: LobbyParticipantDTO): void {
    this._participants.update(current => [...current, newParticipant]);
  }

  public removeParticipant(participantId: string): void {
    this._participants.update(current => [...current.filter(participant => participant.id !== participantId)]);
  }

  public sendMessage(message: string): void {
    this.sendLobbyAction(sendMessageAction(message));
  }
  private getParticipant(participantId: string): LobbyParticipantDTO | undefined{
    return this._participants().find(participant => participant.id === participantId);
  }

  public leaveLobby() {
    this.lobbyWebsocket.disconnect();
  }
}
