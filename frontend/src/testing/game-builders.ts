import { GameDto } from '../api-models/model/gameDto';
import { PlayerDto } from '../api-models/model/playerDto';
import { TimeReport } from '../api-models/model/timeReport';
import { TimerReports } from '../api-models/model/timerReports';
import { GameState } from '../api-models/model/gameState';
import { TimerState } from '../api-models/model/timerState';
import { Role } from '../api-models/model/role';
import { Suit } from '../api-models/model/suit';
import { Card } from '../api-models/model/card';
import { Chug } from '../api-models/model/chug';
import { RankCountDto } from '../api-models/model/rankCountDto';
import { GameEventEnvelope } from '../app/services/models/categories/events/game/game-event-envelope';

export const PARTY_ID = 'ABCDEFGHI';
export const PLAYER_1 = 'p1';
export const PLAYER_2 = 'p2';
export const PLAYER_3 = 'p3';

export function aPlayerDto(overrides: Partial<PlayerDto> = {}): PlayerDto {
  return {
    id: PLAYER_1,
    name: 'Player 1',
    sipsInABeer: 14,
    canDrawChugCard: true,
    stats: { turns: [], chugs: [] },
    session: { isConnected: true, isClaimed: true },
    ...overrides,
  };
}

export function threePlayers(): PlayerDto[] {
  return [
    aPlayerDto({ id: PLAYER_1, name: 'Player 1' }),
    aPlayerDto({ id: PLAYER_2, name: 'Player 2' }),
    aPlayerDto({ id: PLAYER_3, name: 'Player 3' }),
  ];
}

export function aTimeReport(overrides: Partial<TimeReport> = {}): TimeReport {
  return {
    state: TimerState.Running,
    elapsedTime: 1000,
    activeTime: 1000,
    pausedTime: 0,
    pauses: [],
    ...overrides,
  };
}

export function aTimerReports(overrides: Partial<TimerReports> = {}): TimerReports {
  return {
    gameTimeReport: aTimeReport(),
    playerTimeReport: aTimeReport(),
    ...overrides,
  };
}

export function fullRankCounts(count = 3): RankCountDto[] {
  return Array.from({ length: 13 }, (_, index) => ({ rank: index + 2, count }));
}

export function aCard(rank: number, suit: Suit = Suit.Heart): Card {
  return { rank, suit };
}

/** A game in progress, round 1, with {@link PLAYER_1} to draw first. */
export function aGameDto(overrides: Partial<GameDto> = {}): GameDto {
  return {
    name: 'Friday game',
    partyId: PARTY_ID,
    gameState: GameState.InProgress,
    currentRound: 1,
    nextPlayerToDraw: PLAYER_1,
    playerToDrawNextAfter: PLAYER_2,
    players: threePlayers(),
    remainingCardsCount: fullRankCounts(),
    timerReports: aTimerReports(),
    ...overrides,
  };
}

function gameEvent(type: string, fields: object = {}, category = 'GAME_EVENT'): GameEventEnvelope {
  return { category, payload: { type, ...fields } } as GameEventEnvelope;
}

export const gameEvents = {
  snapshot: (gameState: GameDto) =>
    gameEvent('HELLO_GAME_SNAPSHOT', { gameState }, 'GAME_CLIENT_EVENT'),
  identity: (id: string, role: Role) =>
    gameEvent('HELLO_IDENTITY', { id, role }, 'GAME_CLIENT_EVENT'),
  clientConnected: () => gameEvent('CLIENT_CONNECTED', {}, 'GAME_CLIENT_EVENT'),
  drawCard: (fields: { card: Card; drawnBy: string; nextToDraw: string; round?: number }) =>
    gameEvent('DRAW_CARD', {
      turn: { round: fields.round ?? 1, card: fields.card, durationInMillis: 500 },
      drawnBy: fields.drawnBy,
      nextToDraw: fields.nextToDraw,
      nextAfter: fields.nextToDraw,
    }),
  chug: (fields: { chug: Chug; chuggedBy: string; nextToDraw: string }) =>
    gameEvent('CHUG', fields),
  start: () => gameEvent('GAME_START'),
  paused: (timerReports: TimerReports) => gameEvent('GAME_PAUSED', { timerReports }),
  resumed: (timerReports: TimerReports) => gameEvent('GAME_RESUMED', { timerReports }),
  end: (timeReports: TimerReports) =>
    gameEvent('GAME_END', { timeReports, gameReport: {}, playerReports: [] }),
  playerConnected: (playerId: string) =>
    gameEvent('PLAYER_CONNECTED', { playerId }, 'PLAYER_CLIENT_EVENT'),
  playerDisconnected: (playerId: string) =>
    gameEvent('PLAYER_DISCONNECTED', { playerId }, 'PLAYER_CLIENT_EVENT'),
  playerReleased: (playerId: string) => gameEvent('PLAYER_RELEASED', { playerId }),
  playerKicked: (playerId: string, reason = 'Too drunk') =>
    gameEvent('PLAYER_KICKED', { playerId, reason }),
  releaseRequested: (playerId: string) =>
    gameEvent('PLAYER_RELEASE_REQUESTED', { playerId }, 'GAME_CLIENT_EVENT'),
};
