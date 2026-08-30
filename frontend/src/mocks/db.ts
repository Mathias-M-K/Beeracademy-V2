import { GameDto } from '../api-models/model/gameDto';
import { GameState } from '../api-models/model/gameState';
import { LobbyDTO } from '../api-models/model/lobbyDTO';
import { LobbyParticipantDTO } from '../api-models/model/lobbyParticipantDTO';
import { ParticipantPosition } from '../api-models/model/participantPosition';
import { PartyDto } from '../api-models/model/partyDto';
import { PartyState } from '../api-models/model/partyState';
import { PlayerDto } from '../api-models/model/playerDto';
import { RankCountDto } from '../api-models/model/rankCountDto';
import { Role } from '../api-models/model/role';
import { Suit } from '../api-models/model/suit';
import { TimerState } from '../api-models/model/timerState';

/**
 * In-memory stand-in for the backend. HTTP and WebSocket handlers both read and mutate
 * this, so a mocked session behaves like a real one. State lives for the lifetime of the
 * tab — reload to reset.
 */
const lobbies = new Map<string, LobbyDTO>();
const games = new Map<string, GameDto>();
const deckByParty = new Map<string, Card[]>();

interface Card {
  suit: Suit;
  rank: number;
}

/**
 * The real backend derives who you are from the JWT cookie set by POST /lobbies and
 * POST /lobbies/:id/register. Those cookies ride on a cross-origin response the app never
 * reads, so the mock records the same fact here instead: whichever of those calls you made
 * last decides the role the next WebSocket connection is greeted with.
 */
export interface MockSession {
  partyId: string;
  role: Role;
  /** Undefined for the host — it identifies itself by partyId. */
  participantId?: string;
}

let session: MockSession | undefined;

const ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const randomId = (length: number): string =>
  Array.from({ length }, () => ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)]).join('');

const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const SUITS = [Suit.Diamond, Suit.Club, Suit.Heart, Suit.Spade];

function buildDeck(playerCount: number): Card[] {
  const deck = RANKS.flatMap(rank =>
    Array.from({ length: playerCount }, (_, i) => ({ rank, suit: SUITS[i % SUITS.length] })),
  );

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export const db = {
  getSession(): MockSession | undefined {
    return session;
  },

  createLobby(name: string, partyId = randomId(9)): LobbyDTO {
    const lobby: LobbyDTO = { name, partyId, participants: [] };
    lobbies.set(partyId, lobby);
    session = { partyId, role: Role.GameClient };
    return lobby;
  },

  getLobby(partyId: string): LobbyDTO | undefined {
    return lobbies.get(partyId);
  },

  /**
   * `active` is false for participants the host types in — they have no connection of
   * their own — and true for people who joined through the register endpoint.
   */
  addParticipant(partyId: string, name: string, active = true): LobbyParticipantDTO | undefined {
    const lobby = lobbies.get(partyId);
    if (!lobby) {
      return undefined;
    }

    const participant: LobbyParticipantDTO = {
      id: randomId(12),
      name,
      title: 'The Rookie',
      sipsInABeer: 14,
      canDrawAce: true,
      active,
    };

    lobby.participants = [...(lobby.participants ?? []), participant];
    return participant;
  },

  registerParticipant(partyId: string, name: string): LobbyParticipantDTO | undefined {
    const participant = this.addParticipant(partyId, name);
    if (participant) {
      session = { partyId, role: Role.PlayerClient, participantId: participant.id };
    }
    return participant;
  },

  removeParticipant(partyId: string, participantId: string): void {
    const lobby = lobbies.get(partyId);
    if (lobby) {
      lobby.participants = (lobby.participants ?? []).filter(p => p.id !== participantId);
    }
  },

  updateParticipantSettings(
    partyId: string,
    participantId: string,
    changes: Pick<LobbyParticipantDTO, 'sipsInABeer' | 'canDrawAce'>,
  ): void {
    const lobby = lobbies.get(partyId);
    if (lobby) {
      lobby.participants = (lobby.participants ?? []).map(p =>
        p.id === participantId ? { ...p, ...changes } : p,
      );
    }
  },

  rearrangeParticipants(partyId: string, positions: ParticipantPosition[]): LobbyParticipantDTO[] {
    const lobby = lobbies.get(partyId);
    if (!lobby) {
      return [];
    }

    const byId = new Map((lobby.participants ?? []).map(p => [p.id, p]));
    const reordered = [...positions]
      .sort((a, b) => (a.newPosition ?? 0) - (b.newPosition ?? 0))
      .map(position => byId.get(position.participantId))
      .filter((p): p is LobbyParticipantDTO => !!p);

    lobby.participants = reordered;
    return reordered;
  },

  getParty(partyId: string): PartyDto | undefined {
    const lobby = lobbies.get(partyId);
    if (!lobby) {
      return undefined;
    }

    return {
      id: lobby.partyId!,
      name: lobby.name!,
      partyState: games.has(partyId) ? PartyState.Game : PartyState.Lobby,
      session: { isClaimed: true, isConnected: true },
      participants: (lobby.participants ?? []).map(p => ({
        id: p.id!,
        name: p.name!,
        session: { isClaimed: true, isConnected: true },
      })),
    };
  },

  /** Promotes a lobby into a game sitting at AWAITING_START, mirroring LOBBY_START_GAME. */
  startGame(partyId: string): GameDto | undefined {
    const lobby = lobbies.get(partyId);
    if (!lobby) {
      return undefined;
    }

    const players: PlayerDto[] = (lobby.participants ?? []).map(p => ({
      id: p.id,
      name: p.name,
      sipsInABeer: p.sipsInABeer,
      canDrawChugCard: p.canDrawAce,
      stats: { turns: [], chugs: [] },
      session: { isClaimed: true, isConnected: true },
    }));

    const remainingCardsCount: RankCountDto[] = RANKS.map(rank => ({
      rank,
      count: players.length,
    }));

    const game: GameDto = {
      name: lobby.name,
      partyId,
      gameState: GameState.AwaitingStart,
      currentRound: 1,
      players,
      remainingCardsCount,
      nextPlayerToDraw: players.at(0)?.id,
      playerToDrawNextAfter: players.at(1)?.id,
      timerReports: {
        gameTimeReport: { state: TimerState.NotStarted, elapsedTime: 0, activeTime: 0, pausedTime: 0, pauses: [] },
        playerTimeReport: { state: TimerState.NotStarted, elapsedTime: 0, activeTime: 0, pausedTime: 0, pauses: [] },
      },
      session: { isClaimed: true, isConnected: true },
    };

    games.set(partyId, game);
    deckByParty.set(partyId, buildDeck(players.length));
    return game;
  },

  getGame(partyId: string): GameDto | undefined {
    return games.get(partyId);
  },

  /** Pops the next card off the party's shuffled deck. Undefined once it runs dry. */
  drawCard(partyId: string): Card | undefined {
    return deckByParty.get(partyId)?.pop();
  },

  /** Seeded lobby so you can deep-link into a populated party while developing. */
  seed(): void {
    const lobby = this.createLobby('Mocked Lobby', 'MOCK12345');
    this.addParticipant(lobby.partyId!, 'Mathias');
    this.addParticipant(lobby.partyId!, 'Bjarne');
    session = undefined;
  },
};
