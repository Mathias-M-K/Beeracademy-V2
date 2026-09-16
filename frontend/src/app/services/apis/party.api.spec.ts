import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PartyApi } from './party.api';
import { ConfigService } from '../../../config.service';
import { PARTY_ID, PLAYER_1 } from '../../../testing/game-builders';
import { PartyDto } from '../../../api-models/model/partyDto';
import { PartyState } from '../../../api-models/model/partyState';
import { CurrentPartyDto } from '../../../api-models/model/currentPartyDto';
import { Role } from '../../../api-models/model/role';

describe('PartyApi', () => {
  const party: PartyDto = {
    partyState: PartyState.Lobby,
    name: 'Friday party',
    id: PARTY_ID,
    participants: [],
    session: { isConnected: true, isClaimed: true },
  };

  let api: PartyApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: 'http://api.test', environment: 'TEST' } },
      ],
    });

    api = TestBed.inject(PartyApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  describe('getParty', () => {
    it('fetches the party by id', () => {
      // Arrange
      const received = vi.fn();

      // Act
      api.getParty(PARTY_ID).subscribe(received);
      const request = http.expectOne({
        method: 'GET',
        url: `http://api.test/api/parties/${PARTY_ID}`,
      });
      request.flush(party);

      // Assert
      expect(received).toHaveBeenCalledExactlyOnceWith(party);
    });

    it('propagates a failed lookup as an error', () => {
      // Arrange
      const failed = vi.fn();

      // Act
      api.getParty(PARTY_ID).subscribe({ error: failed });
      http
        .expectOne({ method: 'GET', url: `http://api.test/api/parties/${PARTY_ID}` })
        .flush(null, { status: 404, statusText: 'Not Found' });

      // Assert
      expect(failed).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ status: 404 }));
    });
  });

  describe('getCurrentParty', () => {
    it('fetches the current party with the session cookie', () => {
      // Arrange
      const currentParty: CurrentPartyDto = {
        role: Role.PlayerClient,
        playerId: PLAYER_1,
        partyState: party,
      };
      const received = vi.fn();

      // Act
      api.getCurrentParty().subscribe(received);
      const request = http.expectOne({ method: 'GET', url: 'http://api.test/api/parties/current' });
      request.flush(currentParty);

      // Assert
      expect(request.request.withCredentials).toBe(true);
      expect(received).toHaveBeenCalledExactlyOnceWith(currentParty);
    });

    it('emits null when there is no current party', () => {
      // Arrange
      const received = vi.fn();

      // Act
      api.getCurrentParty().subscribe(received);
      http.expectOne({ method: 'GET', url: 'http://api.test/api/parties/current' }).flush(null);

      // Assert
      expect(received).toHaveBeenCalledExactlyOnceWith(null);
    });
  });
});
