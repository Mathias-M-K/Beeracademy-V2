import {DefaultBodyType, http, HttpResponse, JsonBodyType, PathParams, RequestHandler} from 'msw';
import { CreateLobbyResponse } from '../api-models/model/createLobbyResponse';
import { LobbyDTO } from '../api-models/model/lobbyDTO';
import { PartyDto } from '../api-models/model/partyDto';
import { ExceptionResponse } from '../api-models/model/exceptionResponse';
import { RegisterPlayerResponse } from '../api-models/model/registerPlayerResponse';
import { db } from './db';

/**
 * Paths are prefixed with `*` so they match whatever origin ConfigService hands out
 * (http://localhost:8080 in dev, the ingress host elsewhere) without duplicating it here.
 */
const API = '*/api';

/** Handlers that can 404 declare a union body type, so both branches type-check. */
const notFound = <T extends JsonBodyType>(message: string) =>
  HttpResponse.json<T | ExceptionResponse>({ message } as ExceptionResponse, { status: 404 });

export const handlers: RequestHandler[] = [
  // LobbyApi.createLobby
  http.post(`${API}/lobbies`, ({ request }) => {
    const name = new URL(request.url).searchParams.get('name') ?? 'Unnamed lobby';
    const lobby = db.createLobby(name);

    return HttpResponse.json<CreateLobbyResponse>({ partyId: lobby.partyId });
  }),

  // LobbyApi.getLobby
  http.get<PathParams, DefaultBodyType, LobbyDTO | ExceptionResponse>(`${API}/lobbies/:partyId`, ({ params }) => {
    const lobby = db.getLobby(params['partyId'] as string);

    return lobby ? HttpResponse.json(lobby) : notFound<LobbyDTO>('Lobby not found');
  }),

  // LobbyApi.fetchParticipantToken
  http.post<PathParams, DefaultBodyType, RegisterPlayerResponse | ExceptionResponse>(`${API}/lobbies/:partyId/register`, ({ request, params }) => {
    const participantName = new URL(request.url).searchParams.get('participantName') ?? 'Anonymous';
    const participant = db.registerParticipant(params['partyId'] as string, participantName);

    if (!participant) {
      return notFound<RegisterPlayerResponse>('Lobby not found');
    }

    return HttpResponse.json<RegisterPlayerResponse>(
      { id: participant.id },
      { headers: { 'Set-Cookie': `participantToken=mock-jwt-${participant.id}; Path=/` } },
    );
  }),

  // PartyApiService.getParty
  http.get<PathParams, DefaultBodyType, PartyDto | ExceptionResponse>(`${API}/parties/:partyId`, ({ params }) => {
    const party = db.getParty(params['partyId'] as string);

    return party ? HttpResponse.json(party) : notFound<PartyDto>('Party not found');
  }),

  // GameApi.getGamePlayerToken
  http.get(`${API}/games/:partyId/players/:participantId/claim`, ({ params }) => {
    return new HttpResponse(null, {
      status: 204,
      headers: { 'Set-Cookie': `gameToken=mock-jwt-${params['participantId']}; Path=/` },
    });
  }),
];
