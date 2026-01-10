import {Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {CreateGameRequest} from '../../api-models/model/createGameRequest';
import {GameIdDto} from '../../api-models/model/gameIdDto';
import {WebsocketService} from './websocket.service';


@Injectable({
  providedIn: 'root',
})
export class LobbyService {

  constructor(private httpClient: HttpClient, private router: Router) {
  }

  public createGame(players: string[], gameName: string): void {

    const requestBody: CreateGameRequest = {
      name: gameName,
      playerNames: players
    }

    this.httpClient.post<GameIdDto>('http://localhost:8080/api/games', requestBody).subscribe({
      next: response => {
        console.log("Create game response", response);
        this.claimGame(response.gameId!);
      },
      error: error => {
        console.error("Create game error", error);
      }
    });
  }

  private claimGame(gameId: string): void {
    this.httpClient.get<void>(`http://localhost:8080/api/games/${gameId}/claim`, {withCredentials: true}).subscribe({
      next: () => {
        console.log("Game claimed!");
        this.testAuth();
      },
      error: error => {
        console.error("Claim game error", error);
      }
    })
  }

  private testAuth() {
    this.httpClient.get<any>('http://localhost:8080/api/auth/test', {withCredentials: true}).subscribe({
      next: response => {
        console.log("Test auth", response);
        this.router.navigate(['/game']);
      },
      error: error => {
        console.error(error);
      }
    })
  }



}
