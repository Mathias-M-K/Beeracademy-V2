import {Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {catchError, EMPTY, Observable, tap} from 'rxjs';
import {WebSocketSubject} from 'rxjs/internal/observable/dom/WebSocketSubject';
import {webSocket} from 'rxjs/webSocket';

interface CreateGameRequest {
  name: string;
  playerNames: string[];
}

interface CreateGameResponse {
  gameId: string;
}

@Injectable({
  providedIn: 'root',
})
export class LobbyService {

  private socket!: WebSocketSubject<any>;

  public readonly gameId = signal<string>('');

  constructor(private httpClient: HttpClient, private router: Router) {
  }

  public createGame(players: string[], gameName: string): void {
    const requestBody: CreateGameRequest = {
      name: gameName, playerNames: players

    }
    this.httpClient.post<CreateGameResponse>('http://localhost:8080/api/games', requestBody).subscribe({
      next: response => {
        console.log(response);
        this.claimGame(response.gameId);
      },
      error: error => {
        console.error(error);
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
        console.error(error);
      }
    })
  }

  private testAuth() {
    this.httpClient.get<any>('http://localhost:8080/api/auth/test', {withCredentials: true}).subscribe({
      next: response => {
        console.log(response);
        this.connectToWebSocket();
      },
      error: error => {
        console.error(error);
      }
    })
  }

  private connectToWebSocket(): void {
    this.connect().subscribe({
      next: (client: any) => {
        console.log("Connected to WebSocket", client);
      },
      error: error => {
        console.error(error);
      }
    });

  }

  private connect(): Observable<any> {
    if (!this.socket || this.socket.closed) {
      this.socket = webSocket({url: 'http://localhost:8080/client'});
    }

    return this.socket.asObservable().pipe(
      tap({
        error: error => console.error('WebSocket Error:', error),
        complete: () => console.log('WebSocket Connection Closed')
      }),
      catchError(_ => EMPTY)
    );
  }

}
