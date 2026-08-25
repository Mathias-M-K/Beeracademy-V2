import {ApplicationRef, computed, inject, Injectable, linkedSignal, signal} from '@angular/core';
import {WebsocketService} from '../websocket.service';
import {LobbyDTO} from '../../../api-models/model/lobbyDTO';
import {WebsocketEnvelope} from '../models/websocket-envelope';
import {LobbyStateEvent} from '../models/categories/events/lobby/common/lobby-state-event';
import {Role} from '../../../api-models/model/role';
import {IdentityEvent} from '../models/categories/events/common/identity-event';
import {newPlayerAction} from '../models/categories/actions/lobby/lobby-client-action/new-player-action';
import {LobbyAction} from '../models/categories/actions/lobby/lobby-action';
import {
  lobbyClientActionEnvelope,
  lobbyParticipantActionEnvelope
} from '../models/categories/actions/lobby/lobby-action-envelope';
import {NewParticipantEvent} from '../models/categories/events/lobby/common/new-participant-event';
import {
  ParticipantDisconnectedEvent
} from '../models/categories/events/lobby/lobby-participant-event/participant-disconnected-event';
import {removePlayerAction} from '../models/categories/actions/lobby/lobby-client-action/remove-player-action';
import {ParticipantRemovedEvent} from '../models/categories/events/lobby/lobby-client-event/participant-removed-event';
import {LobbyEventEnvelope} from '../models/categories/events/lobby/lobby-event-envelope';
import {sendMessageAction} from '../models/categories/actions/lobby/common/send-message-action';
import {Subject} from 'rxjs';
import {MessageInfo} from '../chat/models/message-info';
import {NewMessageEvent} from '../models/categories/events/lobby/common/new-message-event';
import {MessageDirection} from '../chat/models/message-direction';
import {LobbyParticipantDTO} from '../../../api-models/model/lobbyParticipantDTO';
import {Emoji} from '../../../api-models/model/emoji';
import {sendEmojiAction} from '../models/categories/actions/lobby/common/send-emoji-action';
import {EmojiInfo} from '../chat/models/emoji-info';
import {EMOJI_DISPLAY} from '../chat/models/emoji-display';
import {NewEmojiEvent} from '../models/categories/events/lobby/common/new-emoji.event';
import {
  changeParticipantSettingsAction
} from '../models/categories/actions/lobby/common/update-participant-settings-action';
import {
  ParticipantSettingsUpdatedEvent
} from '../models/categories/events/lobby/common/participant-settings-updated-event';
import {identifyFromEvent, Identity} from '../models/identity';
import {startGameAction} from '../models/categories/actions/lobby/lobby-client-action/start-game-action';
import {Router} from '@angular/router';
import {ParticipantPosition} from '../../../api-models/model/participantPosition';
import {
  rearrangeParticipantAction
} from '../models/categories/actions/lobby/lobby-client-action/rearrange-participant-action';
import {
  ParticipantsRearrangedEvent
} from '../models/categories/events/lobby/lobby-client-event/participants-rearranged-event';
import {ToastService} from '../toast/toast.service';
import {ToastState} from '../../overlay/toast/models/toast-data';
import {OverlayService} from '../overlay/overlay.service';
import {BeerLoaderOverlay} from '../../overlay/beer-loader-overlay/beer-loader-overlay';
import {WebsocketCodes} from '../../../api-models/model/websocketCodes';

@Injectable({
  providedIn: 'root',
})
export class LobbyService {

  private readonly appRef = inject(ApplicationRef);
  private readonly router: Router = inject(Router);
  private readonly websocketService = inject(WebsocketService);
  private readonly toastService: ToastService = inject(ToastService);
  private readonly overlayService = inject(OverlayService);

  private readonly lobbyState = signal<LobbyDTO | undefined>(undefined);

  public readonly title = computed(() => this.lobbyState()?.name);
  public readonly partyId = computed(() => this.lobbyState()?.partyId);
  private readonly _participants = linkedSignal(() => this.lobbyState()?.participants ?? []);
  public readonly participants = this._participants.asReadonly();

  private readonly _identity = signal<Identity | undefined>(undefined);
  public readonly role = computed(() => this._identity()?.role);
  public readonly readableRole = computed(() => {
    switch (this.role()) {
      case Role.PlayerClient :
        return 'Deltager'
      case Role.GameClient :
        return 'Vært'
      default :
        return 'Ukendt'
    }
  });
  public readonly selfId = computed(() => this._identity()?.id);
  public readonly self = computed(() => this.getParticipant(this.selfId() ?? ''));
  public readonly isHost = computed(() => this.role() === Role.GameClient);

  private readonly _creatingGame = linkedSignal(()=>{
    this.lobbyState();
    return false;
  })
  public readonly creatingGame = this._creatingGame.asReadonly();

  private readonly participantsQueuedForRemoval: Set<string> = new Set<string>();

  private readonly _chatMessages = new Subject<MessageInfo>()
  public readonly chatMessages = this._chatMessages.asObservable();

  private readonly _emojiReactions = new Subject<EmojiInfo>();
  public readonly emojiReactions = this._emojiReactions.asObservable();

  private readonly _lobbyReset = new Subject<void>()
  public readonly lobbyReset = this._lobbyReset.asObservable();

  public connectToWebsocket(): void {

    const handle = this.overlayService.openOverlay<void>({component: BeerLoaderOverlay});

    this.websocketService.connectToLobbyWebsocket().then(msgObs => {
      msgObs.subscribe({
        next: msg => this.handleWebsocketMessage(msg),
        error: err => this.onWebsocketConnectionDroppedWithError(err),
        complete: () => this.onWebsocketConnectionDroppedClean()
      })
    }).catch((error: Error) => {
      handle.closed.then(() => {
        this.onWebsocketConnectionDroppedWithError(error);
      });

    }).finally(() => {
      handle.close();
    });
  }

  public startGame(): void {
    this._creatingGame.set(true);
    this.dispatchLobbyAction(startGameAction())
  }

  public onGameStarted() {
    this.router.navigate(['/game']);
  }

  private onWebsocketConnectionDroppedClean() {
    this.lobbyState.set(undefined);
    console.log("Connection dropped");
  }

  private onWebsocketConnectionDroppedWithError(error: unknown): void {

    if (!(error instanceof Error)) {
      return;
    }

    switch (error.cause as number) {
      case WebsocketCodes.LobbyLeaderLeft:
        return this.handleLobbyLeaderLeft();
      case WebsocketCodes.Kicked:
        return this.handleKicked();
      case WebsocketCodes.SessionNotFound:
        return this.handleSessionNotFound();
      case WebsocketCodes.Transitioning:
        return this.onGameStarted();
      default:
        return this.handleUnknownError();
    }
  }

  private handleUnknownError() {
    this.toastService.showToast("Ukendt fejl", "Der skete en ukendt fejl", "error", ToastState.error);
    this.navigateToWelcomeScreen();
  }

  private handleLobbyLeaderLeft() {
    this.toastService.showToast("Leder forlod lobbyen", "Lobby lederen har forladt lobbyen", "door_open");
    this.navigateToWelcomeScreen();
  }

  private handleKicked() {
    this.toastService.showToast("Kicked", "Du er blevet smidt ud af lobbyen", "sports_martial_arts");
    this.navigateToWelcomeScreen();
  }

  private handleSessionNotFound() {
    this.toastService.showToast("Fejl", "Kunne ikke finde lobbyen", "error", ToastState.error);
    this.navigateToWelcomeScreen();
  }

  //Handle websocket messages
  private handleWebsocketMessage(msg: WebsocketEnvelope) {

    const supportedEventCategories: string[] = ['LOBBY_CLIENT_EVENT', 'LOBBY_PARTICIPANT_EVENT'];

    if (!supportedEventCategories.includes(msg.category)) {
      console.error("Can't handle message", msg);
      return;
    }

    const event: LobbyEventEnvelope = msg as LobbyEventEnvelope;

    switch (event.payload.type) {
      case "HELLO_LOBBY_SNAPSHOT" :
        return this.handleHelloLobbySnapshotEvent(event);
      case "HELLO_IDENTITY" :
        return this.handleHelloLobbyIdentityEvent(event);
      case "NEW_PARTICIPANT" :
        return this.handleNewParticipantEvent(event);
      case "MESSAGE_SENT" :
        return this.handleNewMessageEvent(event);
      case "EMOJI_SENT" :
        return this.handleNewEmojiEvent(event);
      case "PARTICIPANT_REMOVED" : {
        return this.handleParticipantRemoved(event);
      }
      case "PARTICIPANT_DISCONNECTED" : {
        return this.handleParticipantDisconnected(event);
      }
      case "SETTINGS_UPDATED" : {
        return this.handleParticipantSettingsUpdate(event);
      }
      case "PARTICIPANTS_REARRANGED": {
        return this.handleParticipantRearranged(event);
      }
    }
  }

  private handleNewMessageEvent(event: LobbyEventEnvelope) {
    const newMessageEvent: NewMessageEvent = event.payload as NewMessageEvent;

    const isSenderHost: boolean = newMessageEvent.senderId === this.partyId();

    let senderName = isSenderHost ?
      'Vært' :
      this.getParticipant(newMessageEvent.senderId)?.name;

    if (!senderName) {
      console.error("Can't identify message owner, somehow?", event);
      senderName = 'Unknown'
    }

    const messageInfo: MessageInfo = {
      direction: MessageDirection.IN,
      message: newMessageEvent.message,
      senderName: senderName,
      senderId: newMessageEvent.senderId,
      fromHost: isSenderHost
    };

    this._chatMessages.next(messageInfo)
  }

  private handleNewEmojiEvent(event: LobbyEventEnvelope) {
    const newEmojiEvent: NewEmojiEvent = event.payload as NewEmojiEvent;

    const isSenderHost: boolean = newEmojiEvent.senderId === this.partyId();

    let senderName = isSenderHost ?
      'Vært' :
      this.getParticipant(newEmojiEvent.senderId)?.name;

    if (!senderName) {
      console.error("Can't identify emoji owner, somehow?", event);
      senderName = 'Unknown'
    }

    const emojiInfo: EmojiInfo = {
      direction: MessageDirection.IN,
      emoji: newEmojiEvent.emoji,
      emojiAsString: EMOJI_DISPLAY[newEmojiEvent.emoji],
      senderName: senderName,
      senderId: newEmojiEvent.senderId,
      fromHost: isSenderHost
    };

    this._emojiReactions.next(emojiInfo);
  }

  private handleNewParticipantEvent(event: LobbyEventEnvelope) {
    const newParticipantEvent: NewParticipantEvent = event.payload as NewParticipantEvent;
    this.addParticipant(newParticipantEvent.participant);
  }

  private handleHelloLobbySnapshotEvent(event: LobbyEventEnvelope) {
    const lobbyStateExchangeEvent = event.payload as LobbyStateEvent;
    this.lobbyState.set(lobbyStateExchangeEvent.lobby)
  }

  private handleHelloLobbyIdentityEvent(event: LobbyEventEnvelope) {
    const lobbyIdentityEvent = event.payload as IdentityEvent;
    this._identity.set(identifyFromEvent(lobbyIdentityEvent));
  }

  private handleParticipantSettingsUpdate(event: LobbyEventEnvelope) {
    const updatedSettingsEvent: ParticipantSettingsUpdatedEvent = event.payload as ParticipantSettingsUpdatedEvent;
    this.updateParticipant(updatedSettingsEvent.participantId, {
      sipsInABeer: updatedSettingsEvent.sipsInABeer,
      canDrawAce: updatedSettingsEvent.canDrawAce
    });
  }

  private handleParticipantRearranged(event: LobbyEventEnvelope) {
    const participantsRearrangedEvent = event.payload as ParticipantsRearrangedEvent;

    this.animateStateChange(() =>
      this._participants.set(participantsRearrangedEvent.participants),
    );
  }

  private handleParticipantRemoved(event: LobbyEventEnvelope) {
    const participantRemovedEvent = event.payload as ParticipantRemovedEvent;
    this.participantsQueuedForRemoval.add(participantRemovedEvent.participantId);

    const participant = this.getParticipant(participantRemovedEvent.participantId)
    if (participant) {
      this.toastService.showToast("Spiller fjernet", `${participant.name} blev fjernet fra spillet`, 'person_remove');
    }

    this.removeParticipant(participantRemovedEvent.participantId);
  }

  private handleParticipantDisconnected(event: LobbyEventEnvelope) {
    const participantDisconnectedEvent: ParticipantDisconnectedEvent = event.payload as ParticipantDisconnectedEvent;

    if (this.participantsQueuedForRemoval.has(participantDisconnectedEvent.participantId)) {
      this.participantsQueuedForRemoval.delete(participantDisconnectedEvent.participantId);
      return;
    }

    const participant = this.getParticipant(participantDisconnectedEvent.participantId)
    if (participant) {
      this.toastService.showToast("Spiller forlod lobbyen", `${participant.name} forlod lobbyen`, 'person_remove', ToastState.error);
    }
    return this.removeParticipant(participantDisconnectedEvent.participantId)
  }

  /**
   * Applies a state change inside a view transition so the affected list
   * animates into its new layout. Falls back to a plain update when the
   * browser lacks the View Transitions API. The `appRef.tick()` flushes the
   * DOM synchronously (zoneless) so the transition captures the new state.
   */
  private animateStateChange(update: () => void): ViewTransition | undefined {
    if (!document.startViewTransition) {
      update();
      return undefined;
    }
    return document.startViewTransition(() => {
      update();
      this.appRef.tick();
    });
  }

  //Dispatch action
  public requestParticipantCreation(name: string): void {
    if (!name.trim()) {
      console.warn("Tried to create participant with blank name");
      return;
    }
    this.dispatchLobbyAction(newPlayerAction(name));
  }

  public requestParticipantRemoval(participantId: string): void {
    this.dispatchLobbyAction(removePlayerAction(participantId))
  }

  public requestParticipantSettingsUpdate(sipsInABeer: number, canDrawAce: boolean, behalfOf?: string) {
    if (this.isHost()) {
      this.dispatchLobbyAction(changeParticipantSettingsAction(sipsInABeer, canDrawAce, behalfOf));
    } else {
      this.dispatchLobbyAction(changeParticipantSettingsAction(sipsInABeer, canDrawAce));
    }

  }

  public requestParticipantsRearranged(newParticipantList: LobbyParticipantDTO[]): void {

    const newParticipantPositions: ParticipantPosition[] = [];

    newParticipantList.forEach((participant: LobbyParticipantDTO, index) => {
      newParticipantPositions.push({participantId: participant.id, newPosition: index})
    });

    this.dispatchLobbyAction(rearrangeParticipantAction(newParticipantPositions));

  }

  private dispatchLobbyAction(action: LobbyAction): void {
    if (this.isHost()) {
      this.websocketService.send(lobbyClientActionEnvelope(action));
    } else {
      this.websocketService.send(lobbyParticipantActionEnvelope(action));
    }
  }

  //Chat
  public sendMessage(message: string): void {
    this.dispatchLobbyAction(sendMessageAction(message));
  }

  public sendEmoji(emoji: Emoji): void {
    this.dispatchLobbyAction(sendEmojiAction(emoji));
  }

  //UI
  public addParticipant(newParticipant: LobbyParticipantDTO): void {

    if (newParticipant.active) {
      this.toastService.showToast("Ny spiller forbundet!", "Velkommen " + newParticipant.name, "person_add", ToastState.success);
    } else {
      this.toastService.showToast("Ny spiller tilføjet", "Velkommen " + newParticipant.name, "person_add", ToastState.success);
    }

    this._participants.update(current => [...current, newParticipant]);
  }

  public removeParticipant(participantId: string): void {
    this.animateStateChange(() =>
      this._participants.update(current => current.filter(participant => participant.id !== participantId)),
    );
  }

  //Helper
  private getParticipant(participantId: string): LobbyParticipantDTO | undefined {
    return this._participants().find(participant => participant.id === participantId);
  }

  private updateParticipant(participantId: string, changes: Partial<LobbyParticipantDTO>) {
    this._participants.update((participants) =>
      participants.map(participant => participant.id === participantId ? {...participant, ...changes} : participant)
    );
  }

  //Disconnect
  public leaveLobby() {
    this.websocketService.disconnect();
    this.navigateToWelcomeScreen();
  }

  private navigateToWelcomeScreen(): void {
    this.router.navigate(["/"]);
  }
}
