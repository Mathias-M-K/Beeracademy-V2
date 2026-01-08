import {Component, ElementRef, HostListener, signal, ViewChild} from '@angular/core';
import {LobbyService} from '../../services/lobby.service';

@Component({
  selector: 'app-create-game-page',
  imports: [],
  templateUrl: './create-game-page.html',
  styleUrl: './create-game-page.scss',
})
export class CreateGamePage {

  @ViewChild('playerInputField')
  private playerInputFieldElement!: ElementRef;

  @ViewChild('gameNameInput')
  private gameNameInputFieldElement!: ElementRef;

  protected players = signal<string[]>([]);

  constructor(private beerAcademyService: LobbyService) {
  }

  protected createGame(){
    const gameName = this.fetchGameNameFieldValue();
    this.beerAcademyService.createGame(this.players(),gameName);
  }

  protected addPlayer(playerName: string) : void{
      this.players.update((players) => [...players, playerName]);
      this.playerInputFieldElement.nativeElement.value = '';
  }

  private fetchGameNameFieldValue(): string {
    return this.playerInputFieldElement.nativeElement.value;
  }

  private fetchNewPlayerFieldValue(): string {
    return this.playerInputFieldElement.nativeElement.value;
  }

  private resetPlayerFieldInputField(): void {
    this.playerInputFieldElement.nativeElement.value = '';
  }

  @HostListener('keydown.enter', ['$event'])
  onEnterClick(event: Event) {
      const inputFieldVal = this.fetchNewPlayerFieldValue();
      this.addPlayer(inputFieldVal);

      this.resetPlayerFieldInputField();
  }



}
