import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {ConfigService} from '../../config.service';
import {CreateLobbyResponse} from '../../api-models/model/createLobbyResponse';
import {Observable} from 'rxjs';
import {RegisterPlayerResponse} from '../../api-models/model/registerPlayerResponse';
import {LobbyDTO} from '../../api-models/model/lobbyDTO';

@Injectable({
  providedIn: 'root',
})
export class LobbyApi {

  private readonly appConfig: ConfigService = inject(ConfigService)
  private readonly apiUrl: string = this.appConfig.apiUrl + "/api";
  private readonly httpClient: HttpClient = inject(HttpClient);

  public createLobby(lobbyName: string): Observable<CreateLobbyResponse> {

    const requestOptions = {
      params: new HttpParams().set('name', lobbyName),
      withCredentials: true
    };

    return this.httpClient.post<CreateLobbyResponse>(this.apiUrl + '/lobbies', null, requestOptions);
  }

  public getLobby(lobbyId: string): Observable<LobbyDTO> {
    return this.httpClient.get<LobbyDTO>(this.apiUrl + '/lobbies/' + lobbyId);
  }

  public fetchParticipantToken(lobbyId: string, participantName: string): Observable<RegisterPlayerResponse> {
    const requestOptions = {
      params: new HttpParams().set('participantName', participantName),
      withCredentials: true
    };

    return this.httpClient.post<RegisterPlayerResponse>(this.apiUrl + `/lobbies/${lobbyId}/register`, null, requestOptions);
  }

}
