import {Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';

interface CreateGameRequest{
  name: string;
  playerNames: string[];
}
interface CreateGameResponse{
  gameId: string;
}

@Injectable({
  providedIn: 'root',
})
export class BeerAcademyService {

  public readonly gameId = signal<string>('');

  constructor(private httpClient: HttpClient) {
  }

  public createGame(players: string[], gameName: string) : void {
    const requestBody: CreateGameRequest = {
      name: gameName, playerNames: players

    }
    this.httpClient.post<CreateGameResponse>('http://localhost:8080/api/games',requestBody).subscribe({
      next: response => {
        console.log(response);
      },
      error: error => {
        console.error(error);
      }
    })
  }
}
