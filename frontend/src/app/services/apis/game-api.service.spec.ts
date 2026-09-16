import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GameApi } from './game-api.service';
import { ConfigService } from '../../../config.service';
import { PARTY_ID, PLAYER_1 } from '../../../testing/game-builders';

describe('GameApi', () => {
  let api: GameApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: 'http://api.test', environment: 'TEST' } },
      ],
    });

    api = TestBed.inject(GameApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  describe('getGamePlayerToken', () => {
    it('claims the player with the session cookie', () => {
      // Arrange
      const completed = vi.fn();

      // Act
      api.getGamePlayerToken(PARTY_ID, PLAYER_1).subscribe({ complete: completed });
      const request = http.expectOne({
        method: 'GET',
        url: `http://api.test/api/games/${PARTY_ID}/players/${PLAYER_1}/claim`,
      });
      request.flush(null);

      // Assert
      expect(request.request.withCredentials).toBe(true);
      expect(completed).toHaveBeenCalledOnce();
    });
  });

  describe('requestPlayerRelease', () => {
    it('posts a release request without a body', () => {
      // Arrange
      const completed = vi.fn();

      // Act
      api.requestPlayerRelease(PARTY_ID, PLAYER_1).subscribe({ complete: completed });
      const request = http.expectOne({
        method: 'POST',
        url: `http://api.test/api/games/${PARTY_ID}/players/${PLAYER_1}/request-release`,
      });
      request.flush(null, { status: 202, statusText: 'Accepted' });

      // Assert
      expect(request.request.body).toBeNull();
      expect(completed).toHaveBeenCalledOnce();
    });
  });
});
