import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ConfigService} from '../../../config.service';
import {Observable} from 'rxjs';

@Service()
export class GameApi {

  private readonly appConfig: ConfigService = inject(ConfigService)
  private readonly apiUrl: string = this.appConfig.apiUrl + "/api";

  private readonly httpClient = inject(HttpClient);

  public getGamePlayerToken(partyId: string, participantId: string): Observable<void> {
    const requestOptions = {
      withCredentials: true
    };
    return this.httpClient.get<void>(`${this.apiUrl}/games/${partyId}/players/${participantId}/claim`, requestOptions);
  }

  public requestPlayerRelease(partyId: string, participantId: string): Observable<void> {
    return this.httpClient.post<void>(`${this.apiUrl}/games/${partyId}/players/${participantId}/request-release`, null)
  }

}
