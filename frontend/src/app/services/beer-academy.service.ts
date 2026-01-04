import {Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class BeerAcademyService {

  public readonly gameId = signal<string>('');

  constructor(private httpClient: HttpClient) {
  }

  public createGame(players: string, gameName: string) : void {

  }

}
