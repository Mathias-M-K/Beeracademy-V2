import { TestBed } from '@angular/core/testing';
import { ApplicationRef } from '@angular/core';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { LobbyService } from './lobby.service';
import { WebsocketService } from '../websocket.service';
import { ToastService } from '../toast/toast.service';
import { FakeWebsocketService } from '../../../testing/fake-websocket.service';
import { createToastServiceStub, ToastServiceStub } from '../../../testing/stubs';
import {
  aLobbyDto,
  aLobbyParticipant,
  LOBBY_PARTY_ID,
  lobbyEvents,
  PARTICIPANT_1,
  PARTICIPANT_2,
  PARTICIPANT_3,
} from '../../../testing/lobby-builders';
import { silenceConsole } from '../../../testing/console';
import { flushMicrotasks } from '../../../testing/async';
import { LobbyDTO } from '../../../api-models/model/lobbyDTO';
import { Role } from '../../../api-models/model/role';
import { Emoji } from '../../../api-models/model/emoji';
import { WebsocketCode } from '../../../api-models/model/websocketCode';
import { ToastState } from '../../overlay/toast/models/toast-data';
import { MessageInfo } from '../chat/models/message-info';
import { EmojiInfo } from '../chat/models/emoji-info';
import { MessageDirection } from '../chat/models/message-direction';

describe('LobbyService', () => {
  let service: LobbyService;
  let websocket: FakeWebsocketService;
  let toasts: ToastServiceStub;
  let router: Router;
  let navigate: ReturnType<typeof vi.spyOn>;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  let logs: ReturnType<typeof silenceConsole>;

  beforeEach(() => {
    logs = silenceConsole();

    websocket = new FakeWebsocketService();
    toasts = createToastServiceStub();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: WebsocketService, useValue: websocket },
        { provide: ToastService, useValue: toasts },
      ],
    });

    router = TestBed.inject(Router);
    navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    service = TestBed.inject(LobbyService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function connect(): Promise<void> {
    const connection = service.connectToWebsocket();
    await websocket.acceptConnection();
    await connection;
  }

  async function joinLobby(lobby: LobbyDTO, role: Role = Role.GameClient): Promise<void> {
    await connect();
    await websocket.emit(lobbyEvents.snapshot(lobby));
    await websocket.emit(
      lobbyEvents.identity(role === Role.GameClient ? LOBBY_PARTY_ID : PARTICIPANT_2, role),
    );
  }

  function navigatedUrl(): string {
    return router.serializeUrl(navigateByUrl.mock.calls[0][0] as UrlTree);
  }

  function collect<T>(source: { subscribe: (next: (value: T) => void) => unknown }): T[] {
    const values: T[] = [];
    source.subscribe((value) => values.push(value));
    return values;
  }

  describe('connection', () => {
    it('connects to the lobby websocket', async () => {
      // Arrange
      const connection = service.connectToWebsocket();

      // Act
      await websocket.acceptConnection();

      // Assert
      await expect(connection).resolves.toBeDefined();
      expect(websocket.connectToLobbyWebsocket).toHaveBeenCalledOnce();
    });

    it('propagates a rejected connection to the caller', async () => {
      // Arrange
      const connection = service.connectToWebsocket();

      // Act & Assert
      const assertion = expect(connection).rejects.toMatchObject({
        cause: WebsocketCode.LobbyNotFound,
      });
      await websocket.rejectConnection(WebsocketCode.LobbyNotFound);
      await assertion;
    });

    it('clears a pending game creation when connecting again', async () => {
      // Arrange
      await joinLobby(aLobbyDto());
      service.startGame();

      // Act
      service.connectToWebsocket();

      // Assert
      expect(service.creatingGame()).toBe(false);
    });
  });

  describe('lobby snapshot', () => {
    it('exposes the lobby through its signals', async () => {
      // Arrange
      const lobby = aLobbyDto();

      // Act
      await joinLobby(lobby);

      // Assert
      expect(service.title()).toBe('Friday lobby');
      expect(service.partyId()).toBe(LOBBY_PARTY_ID);
      expect(service.participants()).toEqual(lobby.participants);
    });

    it('has no participants before a snapshot arrives', async () => {
      // Arrange
      await connect();

      // Act
      const participants = service.participants();

      // Assert
      expect(participants).toEqual([]);
    });

    it('treats a snapshot without participants as an empty lobby', async () => {
      // Arrange
      const lobby = aLobbyDto({ participants: undefined });

      // Act
      await joinLobby(lobby);

      // Assert
      expect(service.participants()).toEqual([]);
    });

    it('ignores messages outside the lobby event categories', async () => {
      // Arrange
      await connect();

      // Act
      await websocket.emit({ ...lobbyEvents.snapshot(aLobbyDto()), category: 'GAME_EVENT' });

      // Assert
      expect(service.title()).toBeUndefined();
      expect(logs.error).toHaveBeenCalledWith("Can't handle message", expect.anything());
    });

    it('accepts lobby events sent to participants', async () => {
      // Arrange
      await connect();

      // Act
      await websocket.emit({
        ...lobbyEvents.snapshot(aLobbyDto()),
        category: 'LOBBY_PARTICIPANT_EVENT',
      });

      // Assert
      expect(service.title()).toBe('Friday lobby');
    });
  });

  describe('identity', () => {
    it('recognises the lobby host', async () => {
      // Arrange
      const lobby = aLobbyDto();

      // Act
      await joinLobby(lobby, Role.GameClient);

      // Assert
      expect(service.role()).toBe(Role.GameClient);
      expect(service.isHost()).toBe(true);
      expect(service.readableRole()).toBe('Vært');
      expect(service.selfId()).toBe(LOBBY_PARTY_ID);
    });

    it('recognises a participant and finds itself among the participants', async () => {
      // Arrange
      const lobby = aLobbyDto();

      // Act
      await joinLobby(lobby, Role.PlayerClient);

      // Assert
      expect(service.isHost()).toBe(false);
      expect(service.readableRole()).toBe('Deltager');
      expect(service.self()?.id).toBe(PARTICIPANT_2);
    });

    it('describes an unknown role before identifying', async () => {
      // Arrange
      await connect();

      // Act
      const readableRole = service.readableRole();

      // Assert
      expect(readableRole).toBe('Ukendt');
      expect(service.self()).toBeUndefined();
    });
  });

  describe('participants joining', () => {
    it('adds a connected participant and welcomes them as connected', async () => {
      // Arrange
      await joinLobby(aLobbyDto());
      const newcomer = aLobbyParticipant({ id: 'lp4', name: 'Newcomer', active: true });

      // Act
      await websocket.emit(lobbyEvents.newParticipant(newcomer));

      // Assert
      expect(service.participants().at(-1)).toEqual(newcomer);
      expect(toasts.showToast).toHaveBeenCalledWith(
        'Ny spiller forbundet!',
        'Velkommen Newcomer',
        'person_add',
        ToastState.success,
      );
    });

    it('adds an inactive participant and welcomes them as added', async () => {
      // Arrange
      await joinLobby(aLobbyDto());
      const newcomer = aLobbyParticipant({ id: 'lp4', name: 'Newcomer', active: false });

      // Act
      await websocket.emit(lobbyEvents.newParticipant(newcomer));

      // Assert
      expect(service.participants()).toHaveLength(4);
      expect(toasts.showToast).toHaveBeenCalledWith(
        'Ny spiller tilføjet',
        'Velkommen Newcomer',
        'person_add',
        ToastState.success,
      );
    });
  });

  describe('participants leaving', () => {
    it('removes a kicked participant and announces the removal', async () => {
      // Arrange
      await joinLobby(aLobbyDto());

      // Act
      await websocket.emit(lobbyEvents.participantRemoved(PARTICIPANT_2));

      // Assert
      expect(service.participants().map((participant) => participant.id)).toEqual([
        PARTICIPANT_1,
        PARTICIPANT_3,
      ]);
      expect(toasts.showToast).toHaveBeenCalledOnce();
      expect(toasts.showToast).toHaveBeenCalledWith(
        'Spiller fjernet',
        'Participant 2 blev fjernet fra spillet',
        'person_remove',
      );
    });

    it('does not announce the disconnect that follows a removal', async () => {
      // Arrange
      await joinLobby(aLobbyDto());
      await websocket.emit(lobbyEvents.participantRemoved(PARTICIPANT_2));

      // Act
      await websocket.emit(lobbyEvents.participantDisconnected(PARTICIPANT_2));

      // Assert
      expect(toasts.showToast).toHaveBeenCalledOnce();
    });

    it('does not announce removal of an unknown participant', async () => {
      // Arrange
      await joinLobby(aLobbyDto());

      // Act
      await websocket.emit(lobbyEvents.participantRemoved('unknown'));

      // Assert
      expect(toasts.showToast).not.toHaveBeenCalled();
      expect(service.participants()).toHaveLength(3);
    });

    it('removes a disconnected participant and announces they left', async () => {
      // Arrange
      await joinLobby(aLobbyDto());

      // Act
      await websocket.emit(lobbyEvents.participantDisconnected(PARTICIPANT_1));

      // Assert
      expect(service.participants().map((participant) => participant.id)).toEqual([
        PARTICIPANT_2,
        PARTICIPANT_3,
      ]);
      expect(toasts.showToast).toHaveBeenCalledWith(
        'Spiller forlod lobbyen',
        'Participant 1 forlod lobbyen',
        'person_remove',
        ToastState.error,
      );
    });

    it('does not announce the disconnect of an unknown participant', async () => {
      // Arrange
      await joinLobby(aLobbyDto());

      // Act
      await websocket.emit(lobbyEvents.participantDisconnected('unknown'));

      // Assert
      expect(toasts.showToast).not.toHaveBeenCalled();
    });

    it('removes a participant locally', async () => {
      // Arrange
      await joinLobby(aLobbyDto());

      // Act
      service.removeParticipant(PARTICIPANT_3);

      // Assert
      expect(service.participants().map((participant) => participant.id)).toEqual([
        PARTICIPANT_1,
        PARTICIPANT_2,
      ]);
    });

    it('animates the removal with a view transition when the browser supports it', async () => {
      // Arrange
      await joinLobby(aLobbyDto());
      const tick = vi.spyOn(TestBed.inject(ApplicationRef), 'tick');
      const startViewTransition = vi.fn((update: () => void) => {
        update();
        return {} as ViewTransition;
      });
      Object.defineProperty(document, 'startViewTransition', {
        configurable: true,
        value: startViewTransition,
      });

      try {
        // Act
        await websocket.emit(lobbyEvents.participantDisconnected(PARTICIPANT_1));

        // Assert
        expect(startViewTransition).toHaveBeenCalledOnce();
        expect(tick).toHaveBeenCalled();
        expect(service.participants()).toHaveLength(2);
      } finally {
        delete (document as { startViewTransition?: unknown }).startViewTransition;
      }
    });
  });

  describe('participant updates', () => {
    it('applies updated settings to the matching participant only', async () => {
      // Arrange
      await joinLobby(aLobbyDto());

      // Act
      await websocket.emit(lobbyEvents.settingsUpdated(PARTICIPANT_2, 7, false));

      // Assert
      expect(service.participants()).toEqual([
        aLobbyParticipant({ id: PARTICIPANT_1, name: 'Participant 1' }),
        aLobbyParticipant({
          id: PARTICIPANT_2,
          name: 'Participant 2',
          sipsInABeer: 7,
          canDrawAce: false,
        }),
        aLobbyParticipant({ id: PARTICIPANT_3, name: 'Participant 3' }),
      ]);
    });

    it('replaces the participant order when participants are rearranged', async () => {
      // Arrange
      const lobby = aLobbyDto();
      await joinLobby(lobby);
      const [first, second, third] = lobby.participants!;

      // Act
      await websocket.emit(lobbyEvents.participantsRearranged([third, first, second]));

      // Assert
      expect(service.participants().map((participant) => participant.id)).toEqual([
        PARTICIPANT_3,
        PARTICIPANT_1,
        PARTICIPANT_2,
      ]);
    });

    it('resets the participants when a new snapshot arrives', async () => {
      // Arrange
      await joinLobby(aLobbyDto());
      await websocket.emit(lobbyEvents.participantDisconnected(PARTICIPANT_1));

      // Act
      await websocket.emit(lobbyEvents.snapshot(aLobbyDto()));

      // Assert
      expect(service.participants()).toHaveLength(3);
    });
  });

  describe('chat', () => {
    it('publishes a message from the host', async () => {
      // Arrange
      await joinLobby(aLobbyDto(), Role.PlayerClient);
      const messages = collect<MessageInfo>(service.chatMessages);

      // Act
      await websocket.emit(lobbyEvents.messageSent(LOBBY_PARTY_ID, 'Cheers'));

      // Assert
      expect(messages).toEqual([
        {
          direction: MessageDirection.IN,
          message: 'Cheers',
          senderName: 'Vært',
          senderId: LOBBY_PARTY_ID,
          fromHost: true,
        },
      ]);
    });

    it('publishes a message from a participant under their name', async () => {
      // Arrange
      await joinLobby(aLobbyDto());
      const messages = collect<MessageInfo>(service.chatMessages);

      // Act
      await websocket.emit(lobbyEvents.messageSent(PARTICIPANT_3, 'Skål'));

      // Assert
      expect(messages).toEqual([
        {
          direction: MessageDirection.IN,
          message: 'Skål',
          senderName: 'Participant 3',
          senderId: PARTICIPANT_3,
          fromHost: false,
        },
      ]);
    });

    it('publishes a message from an unknown sender as Unknown', async () => {
      // Arrange
      await joinLobby(aLobbyDto());
      const messages = collect<MessageInfo>(service.chatMessages);

      // Act
      await websocket.emit(lobbyEvents.messageSent('ghost', 'Boo'));

      // Assert
      expect(messages).toEqual([
        expect.objectContaining({ senderName: 'Unknown', fromHost: false }),
      ]);
    });

    it('publishes an emoji from the host', async () => {
      // Arrange
      await joinLobby(aLobbyDto());
      const emojis = collect<EmojiInfo>(service.emojiReactions);

      // Act
      await websocket.emit(lobbyEvents.emojiSent(LOBBY_PARTY_ID, Emoji.Beer));

      // Assert
      expect(emojis).toEqual([
        {
          direction: MessageDirection.IN,
          emoji: Emoji.Beer,
          emojiAsString: '🍺',
          senderName: 'Vært',
          senderId: LOBBY_PARTY_ID,
          fromHost: true,
        },
      ]);
    });

    it('publishes an emoji from a participant under their name', async () => {
      // Arrange
      await joinLobby(aLobbyDto());
      const emojis = collect<EmojiInfo>(service.emojiReactions);

      // Act
      await websocket.emit(lobbyEvents.emojiSent(PARTICIPANT_1, Emoji.Fire));

      // Assert
      expect(emojis).toEqual([
        expect.objectContaining({
          emoji: Emoji.Fire,
          emojiAsString: '🔥',
          senderName: 'Participant 1',
          fromHost: false,
        }),
      ]);
    });

    it('publishes an emoji from an unknown sender as Unknown', async () => {
      // Arrange
      await joinLobby(aLobbyDto());
      const emojis = collect<EmojiInfo>(service.emojiReactions);

      // Act
      await websocket.emit(lobbyEvents.emojiSent('ghost', Emoji.Skull));

      // Assert
      expect(emojis).toEqual([expect.objectContaining({ senderName: 'Unknown' })]);
    });

    // known-issues: LobbyService never emits lobbyReset, so chat history survives across lobbies
    it.fails('signals a lobby reset when leaving and joining a lobby', async () => {
      // Arrange
      await joinLobby(aLobbyDto());
      const resets = collect<void>(service.lobbyReset);

      // Act
      service.leaveLobby();
      await joinLobby(aLobbyDto({ name: 'Another lobby' }));

      // Assert
      expect(resets.length).toBeGreaterThan(0);
    });
  });

  describe('actions', () => {
    it.each([
      [Role.GameClient, 'LOBBY_CLIENT_ACTION'],
      [Role.PlayerClient, 'LOBBY_PARTICIPANT_ACTION'],
    ])('sends actions of a %s in a %s envelope', async (role, category) => {
      // Arrange
      await joinLobby(aLobbyDto(), role);

      // Act
      service.sendMessage('Hello');

      // Assert
      expect(websocket.lastSent()).toEqual({
        category,
        payload: { type: 'SEND_MESSAGE', message: 'Hello' },
      });
    });

    it('sends actions as a participant before the identity is known', async () => {
      // Arrange
      await connect();

      // Act
      service.sendEmoji(Emoji.Confetti);

      // Assert
      expect(websocket.lastSent()?.category).toBe('LOBBY_PARTICIPANT_ACTION');
    });

    it('requests creation of a participant', async () => {
      // Arrange
      await joinLobby(aLobbyDto());

      // Act
      service.requestParticipantCreation('Newcomer');

      // Assert
      expect(websocket.sent).toEqual([
        {
          category: 'LOBBY_CLIENT_ACTION',
          payload: { type: 'CREATE_PARTICIPANT', name: 'Newcomer' },
        },
      ]);
    });

    it.each(['', '   '])('does not request a participant with blank name %j', async (name) => {
      // Arrange
      await joinLobby(aLobbyDto());

      // Act
      service.requestParticipantCreation(name);

      // Assert
      expect(websocket.send).not.toHaveBeenCalled();
    });

    it('requests removal of a participant', async () => {
      // Arrange
      await joinLobby(aLobbyDto());

      // Act
      service.requestParticipantRemoval(PARTICIPANT_2);

      // Assert
      expect(websocket.lastSent()).toEqual({
        category: 'LOBBY_CLIENT_ACTION',
        payload: { type: 'REMOVE_PARTICIPANT', participantId: PARTICIPANT_2 },
      });
    });

    it('sends an emoji', async () => {
      // Arrange
      await joinLobby(aLobbyDto(), Role.PlayerClient);

      // Act
      service.sendEmoji(Emoji.Vomit);

      // Assert
      expect(websocket.lastSent()).toEqual({
        category: 'LOBBY_PARTICIPANT_ACTION',
        payload: { type: 'SEND_EMOJI', emoji: Emoji.Vomit },
      });
    });

    it('lets the host update settings on behalf of a participant', async () => {
      // Arrange
      await joinLobby(aLobbyDto(), Role.GameClient);

      // Act
      service.requestParticipantSettingsUpdate(10, false, PARTICIPANT_3);

      // Assert
      expect(websocket.lastSent()).toEqual({
        category: 'LOBBY_CLIENT_ACTION',
        payload: {
          type: 'UPDATE_SETTINGS',
          sipsInABeer: 10,
          canDrawAce: false,
          behalfOf: PARTICIPANT_3,
        },
      });
    });

    it('ignores the behalf-of target when a participant updates settings', async () => {
      // Arrange
      await joinLobby(aLobbyDto(), Role.PlayerClient);

      // Act
      service.requestParticipantSettingsUpdate(12, true, PARTICIPANT_3);

      // Assert
      const payload = websocket.lastSent() as unknown as { category: string; payload: object };
      expect(payload.category).toBe('LOBBY_PARTICIPANT_ACTION');
      expect(payload.payload).toMatchObject({
        type: 'UPDATE_SETTINGS',
        sipsInABeer: 12,
        canDrawAce: true,
      });
      expect((payload.payload as { behalfOf?: string }).behalfOf).toBeUndefined();
    });

    it('requests the participants in their new order', async () => {
      // Arrange
      const lobby = aLobbyDto();
      await joinLobby(lobby);
      const [first, second, third] = lobby.participants!;

      // Act
      service.requestParticipantsRearranged([second, third, first]);

      // Assert
      expect(websocket.lastSent()).toEqual({
        category: 'LOBBY_CLIENT_ACTION',
        payload: {
          type: 'REARRANGE_PARTICIPANTS',
          positions: [
            { participantId: PARTICIPANT_2, newPosition: 0 },
            { participantId: PARTICIPANT_3, newPosition: 1 },
            { participantId: PARTICIPANT_1, newPosition: 2 },
          ],
        },
      });
    });
  });

  describe('starting the game', () => {
    it('requests the game start and marks the game as being created', async () => {
      // Arrange
      await joinLobby(aLobbyDto());

      // Act
      service.startGame();

      // Assert
      expect(service.creatingGame()).toBe(true);
      expect(websocket.lastSent()).toEqual({
        category: 'LOBBY_CLIENT_ACTION',
        payload: { type: 'LOBBY_START_GAME' },
      });
    });

    it('stops creating the game and shows an error when an action fails', async () => {
      // Arrange
      await joinLobby(aLobbyDto());
      service.startGame();

      // Act
      await websocket.emit(
        lobbyEvents.exception({ exception: 'NotEnoughPlayersException', message: 'Too few' }),
      );

      // Assert
      expect(service.creatingGame()).toBe(false);
      expect(toasts.showToast).toHaveBeenCalledWith(
        'Der skete en fejl',
        'Handlingen kunne ikke udføres',
        'error',
        ToastState.error,
      );
    });

    it('handles an exception regardless of its envelope category', async () => {
      // Arrange
      await joinLobby(aLobbyDto());

      // Act
      await websocket.emit({ ...lobbyEvents.exception({}), category: 'GAME_CLIENT_EVENT' });

      // Assert
      expect(toasts.showToast).toHaveBeenCalledOnce();
    });
  });

  describe('connection loss', () => {
    it('sends everyone to the start page when the lobby leader leaves', async () => {
      // Arrange
      await joinLobby(aLobbyDto(), Role.PlayerClient);

      // Act
      await websocket.dropConnection(WebsocketCode.LobbyLeaderLeft);

      // Assert
      expect(navigatedUrl()).toBe('/');
      expect(toasts.showToast).toHaveBeenCalledWith(
        'Leder forlod lobbyen',
        'Lobby lederen har forladt lobbyen',
        'door_open',
      );
    });

    it('sends the user to the start page when kicked', async () => {
      // Arrange
      await joinLobby(aLobbyDto(), Role.PlayerClient);

      // Act
      await websocket.dropConnection(WebsocketCode.Kicked);

      // Assert
      expect(navigatedUrl()).toBe('/');
      expect(toasts.showToast).toHaveBeenCalledWith(
        'Kicked',
        'Du er blevet smidt ud af lobbyen',
        'sports_martial_arts',
      );
    });

    it('moves on to the game while the lobby transitions, still creating the game', async () => {
      // Arrange
      await joinLobby(aLobbyDto());
      service.startGame();

      // Act
      await websocket.dropConnection(WebsocketCode.Transitioning);

      // Assert
      expect(navigatedUrl()).toBe('/game');
      expect(service.creatingGame()).toBe(true);
      expect(toasts.showToast).not.toHaveBeenCalled();
    });

    it.each([WebsocketCode.GoingAway, WebsocketCode.AbnormalClosure, WebsocketCode.Unknown])(
      'sends the user to the start page with an error on close code %i',
      async (code) => {
        // Arrange
        await joinLobby(aLobbyDto());
        service.startGame();

        // Act
        await websocket.dropConnection(code);

        // Assert
        expect(navigatedUrl()).toBe('/');
        expect(service.creatingGame()).toBe(false);
        expect(toasts.showToast).toHaveBeenCalledWith(
          'Ukendt fejl',
          'Der skete en ukendt fejl',
          'error',
          ToastState.error,
        );
      },
    );

    it('clears the lobby when the connection closes cleanly', async () => {
      // Arrange
      await joinLobby(aLobbyDto());
      service.startGame();

      // Act
      await websocket.closeConnection();

      // Assert
      expect(service.title()).toBeUndefined();
      expect(service.participants()).toEqual([]);
      expect(service.creatingGame()).toBe(false);
      expect(navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('leaving the lobby', () => {
    it('disconnects and returns to the start page', async () => {
      // Arrange
      await joinLobby(aLobbyDto());

      // Act
      service.leaveLobby();
      await flushMicrotasks();

      // Assert
      expect(websocket.disconnect).toHaveBeenCalledOnce();
      expect(navigate).toHaveBeenCalledWith(['/']);
    });
  });
});
