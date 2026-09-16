import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LobbyApi } from './lobby-api.service';
import { ConfigService } from '../../../config.service';
import { PARTY_ID } from '../../../testing/game-builders';
import { CreateLobbyResponse } from '../../../api-models/model/createLobbyResponse';
import { RegisterPlayerResponse } from '../../../api-models/model/registerPlayerResponse';
import { LobbyDTO } from '../../../api-models/model/lobbyDTO';

describe('LobbyApi', () => {
  let api: LobbyApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: 'http://api.test', environment: 'TEST' } },
      ],
    });

    api = TestBed.inject(LobbyApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  describe('createLobby', () => {
    it('posts the lobby name as a query parameter with the session cookie', () => {
      // Arrange
      const response = { partyId: PARTY_ID } as unknown as CreateLobbyResponse;
      const received = vi.fn();

      // Act
      api.createLobby('Friday party').subscribe(received);
      const request = http.expectOne(
        (req) => req.method === 'POST' && req.url === 'http://api.test/api/lobbies',
      );
      request.flush(response);

      // Assert
      expect(request.request.params.get('name')).toBe('Friday party');
      expect(request.request.body).toBeNull();
      expect(request.request.withCredentials).toBe(true);
      expect(received).toHaveBeenCalledExactlyOnceWith(response);
    });
  });

  describe('getLobby', () => {
    it('fetches the lobby by party id', () => {
      // Arrange
      const lobby = { name: 'Friday party' } as unknown as LobbyDTO;
      const received = vi.fn();

      // Act
      api.getLobby(PARTY_ID).subscribe(received);
      const request = http.expectOne({
        method: 'GET',
        url: `http://api.test/api/lobbies/${PARTY_ID}`,
      });
      request.flush(lobby);

      // Assert
      expect(received).toHaveBeenCalledExactlyOnceWith(lobby);
    });
  });

  describe('fetchParticipantToken', () => {
    it('registers the participant name with the session cookie', () => {
      // Arrange
      const response = { participantId: 'participant-1' } as unknown as RegisterPlayerResponse;
      const received = vi.fn();

      // Act
      api.fetchParticipantToken(PARTY_ID, 'Anna').subscribe(received);
      const request = http.expectOne(
        (req) =>
          req.method === 'POST' && req.url === `http://api.test/api/lobbies/${PARTY_ID}/register`,
      );
      request.flush(response);

      // Assert
      expect(request.request.params.get('participantName')).toBe('Anna');
      expect(request.request.body).toBeNull();
      expect(request.request.withCredentials).toBe(true);
      expect(received).toHaveBeenCalledExactlyOnceWith(response);
    });
  });
});
