import { ws } from 'msw';
import type { WebSocketHandler } from 'msw';
import { GameState } from '../api-models/model/gameState';
import { Role } from '../api-models/model/role';
import { TimerState } from '../api-models/model/timerState';
import { WebsocketCodes } from '../api-models/model/websocketCodes';
import { db } from './db';

/**
 * MSW patches the global WebSocket constructor, so these run entirely in the page — the
 * service worker is not involved. `rxjs/webSocket` uses that same global, which is why
 * WebsocketService is intercepted without knowing anything about the mock.
 */
const lobbyLink = ws.link('*/ws/lobby');
const gameLink = ws.link('*/ws/game');

/** Anything the client can be sent. `category` is what the services switch on first. */
type Envelope = { category: string; payload: { type: string } & Record<string, unknown> };

type Client = { send(data: string): void; close(code?: number, reason?: string): void };

/**
 * WebsocketService resolves its connect promise from inside the message handler, and the
 * caller subscribes in a `.then` — i.e. a microtask later. Anything pushed in the same
 * tick as the handshake would land before that subscription exists and be dropped, so
 * every follow-up message is spaced out by a turn of the event loop.
 */
function sendSequence(client: Client, envelopes: Envelope[], stepMs = 20): void {
  envelopes.forEach((envelope, index) => {
    setTimeout(() => client.send(JSON.stringify(envelope)), index * stepMs);
  });
}

const handshake = (category: string): Envelope => ({ category, payload: { type: 'HANDSHAKE' } });

/* ------------------------------------------------------------------- lobby */

const lobbyHandler = lobbyLink.addEventListener('connection', ({ client }) => {
  const session = db.getSession();
  const lobby = session && db.getLobby(session.partyId);

  if (!session || !lobby) {
    // Same close code the backend uses when the JWT points at nothing.
    client.close(WebsocketCodes.SessionNotFound, 'No mock session — create or join a lobby first');
    return;
  }

  const isHost = session.role === Role.GameClient;
  // The category decides which of the two managers the backend would have used; the
  // lobby service only accepts these two.
  const category = isHost ? 'LOBBY_CLIENT_EVENT' : 'LOBBY_PARTICIPANT_EVENT';
  const selfId = isHost ? session.partyId : session.participantId!;

  sendSequence(client, [
    handshake(category),
    { category, payload: { type: 'HELLO_IDENTITY', role: session.role, id: selfId } },
    { category, payload: { type: 'HELLO_LOBBY_SNAPSHOT', lobby } },
  ]);

  client.addEventListener('message', event => {
    const action = JSON.parse(String(event.data)).payload as { type: string } & Record<string, any>;

    switch (action['type']) {
      case 'CREATE_PARTICIPANT': {
        // Host-typed participants are inactive: nobody is connected on their behalf.
        const participant = db.addParticipant(session.partyId, action['name'], false);
        return sendSequence(client, [
          { category, payload: { type: 'NEW_PARTICIPANT', participant } },
        ]);
      }

      case 'REMOVE_PARTICIPANT': {
        db.removeParticipant(session.partyId, action['participantId']);
        return sendSequence(client, [
          {
            category,
            payload: {
              type: 'PARTICIPANT_REMOVED',
              participantId: action['participantId'],
              kickReason: 'Removed by host',
            },
          },
        ]);
      }

      case 'UPDATE_SETTINGS': {
        const participantId = action['behalfOf'] ?? selfId;
        db.updateParticipantSettings(session.partyId, participantId, {
          sipsInABeer: action['sipsInABeer'],
          canDrawAce: action['canDrawAce'],
        });
        return sendSequence(client, [
          {
            category,
            payload: {
              type: 'SETTINGS_UPDATED',
              participantId,
              sipsInABeer: action['sipsInABeer'],
              canDrawAce: action['canDrawAce'],
            },
          },
        ]);
      }

      case 'REARRANGE_PARTICIPANTS': {
        const participants = db.rearrangeParticipants(session.partyId, action['positions']);
        return sendSequence(client, [
          { category, payload: { type: 'PARTICIPANTS_REARRANGED', participants } },
        ]);
      }

      // Chat and reactions are broadcast to the *other* clients — the sender already
      // renders its own outgoing message locally, so echoing would double it up.
      case 'SEND_MESSAGE':
        return lobbyLink.broadcastExcept(
          client,
          JSON.stringify({
            category,
            payload: { type: 'MESSAGE_SENT', message: action['message'], senderId: selfId },
          }),
        );

      case 'SEND_EMOJI':
        return lobbyLink.broadcastExcept(
          client,
          JSON.stringify({
            category,
            payload: { type: 'EMOJI_SENT', emoji: action['emoji'], senderId: selfId },
          }),
        );

      case 'LOBBY_START_GAME': {
        db.startGame(session.partyId);
        // The backend hands over to the game socket by closing this one with
        // Transitioning; the lobby service reads that code and routes to /game.
        setTimeout(() => client.close(WebsocketCodes.Transitioning, 'Game starting'), 20);
        return;
      }

      default:
        console.warn('[mock ws/lobby] unhandled action', action);
    }
  });
});

/* -------------------------------------------------------------------- game */

const gameHandler = gameLink.addEventListener('connection', ({ client }) => {
  const session = db.getSession();
  const game = session && db.getGame(session.partyId);

  if (!session || !game) {
    client.close(WebsocketCodes.GameNotFound, 'No mock game — start one from the lobby first');
    return;
  }

  const isHost = session.role === Role.GameClient;
  const category = isHost ? 'GAME_CLIENT_EVENT' : 'PLAYER_CLIENT_EVENT';
  const selfId = isHost ? session.partyId : session.participantId!;

  sendSequence(client, [
    handshake(category),
    { category, payload: { type: 'HELLO_IDENTITY', role: session.role, id: selfId } },
    { category, payload: { type: 'HELLO_GAME_SNAPSHOT', gameState: game } },
  ]);

  client.addEventListener('message', event => {
    const action = JSON.parse(String(event.data)).payload as { type: string } & Record<string, any>;

    switch (action['type']) {
      case 'START_GAME': {
        game.gameState = GameState.InProgress;
        game.timerReports = {
          gameTimeReport: { state: TimerState.Running, elapsedTime: 0, activeTime: 0, pausedTime: 0, pauses: [] },
          playerTimeReport: { state: TimerState.Running, elapsedTime: 0, activeTime: 0, pausedTime: 0, pauses: [] },
        };
        return sendSequence(client, [{ category: 'GAME_EVENT', payload: { type: 'GAME_START' } }]);
      }

      case 'DRAW_CARD': {
        const card = db.drawCard(session.partyId);
        if (!card) {
          return sendSequence(client, [
            {
              category: 'GAME_EVENT',
              payload: { type: 'GAME_END', gameReport: {}, playerReports: [], timeReports: game.timerReports },
            },
          ]);
        }

        const players = game.players ?? [];
        const drawnBy = game.nextPlayerToDraw!;
        const drawnIndex = players.findIndex(p => p.id === drawnBy);
        const nextToDraw = players[(drawnIndex + 1) % players.length]?.id;
        const nextAfter = players[(drawnIndex + 2) % players.length]?.id;

        game.lastPlayerToDraw = drawnBy;
        game.nextPlayerToDraw = nextToDraw;
        game.playerToDrawNextAfter = nextAfter;
        game.lastCard = card;
        // Rank 14 is the chug card — the game pauses on the drawer until a chug is registered.
        game.gameState = card.rank === 14 ? GameState.AwaitingChug : GameState.InProgress;

        return sendSequence(client, [
          {
            category: 'GAME_EVENT',
            payload: {
              type: 'DRAW_CARD',
              turn: { round: game.currentRound, card, durationInMillis: action['duration'] },
              drawnBy,
              nextToDraw,
              nextAfter,
            },
          },
        ]);
      }

      case 'REGISTER_CHUG': {
        game.gameState = GameState.InProgress;
        return sendSequence(client, [
          {
            category: 'GAME_EVENT',
            payload: {
              type: 'CHUG',
              chug: action['chug'],
              chuggedBy: game.lastPlayerToDraw,
              nextToDraw: game.nextPlayerToDraw,
            },
          },
        ]);
      }

      case 'PAUSE_GAME':
        return sendSequence(client, [
          { category: 'GAME_EVENT', payload: { type: 'GAME_PAUSED', timerReports: game.timerReports } },
        ]);

      case 'RESUME_GAME':
        return sendSequence(client, [
          { category: 'GAME_EVENT', payload: { type: 'GAME_RESUMED', timerReports: game.timerReports } },
        ]);

      default:
        console.warn('[mock ws/game] unhandled action', action);
    }
  });
});

export const wsHandlers: WebSocketHandler[] = [lobbyHandler, gameHandler];
