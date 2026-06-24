import {Component, ElementRef, HostListener, inject, signal, ViewChild} from '@angular/core';
import {OldLobbyService} from '../../services/old-lobby.service';

@Component({
  selector: 'app-create-game-page',
  templateUrl: './create-game-page.html',
  styleUrl: './create-game-page.scss',
  standalone: true
})
export class CreateGamePage {

  @ViewChild('playerInputField')
  private readonly playerInputFieldElement!: ElementRef;

  @ViewChild('gameNameInput')
  private readonly gameNameInputFieldElement!: ElementRef;

  protected players = signal<string[]>(['Mathias','Frederik','Lasse','Steffen']);

  private readonly beerAcademyService: OldLobbyService = inject(OldLobbyService);

  protected createGame(){
    const gameName = this.fetchGameNameFieldValue();
    this.beerAcademyService.createGame(this.players(),gameName);
  }

  protected addPlayer(playerName: string) : void{
      this.players.update((players) => [...players, playerName]);
      this.playerInputFieldElement.nativeElement.value = '';
  }

  private fetchGameNameFieldValue(): string {
    return this.gameNameInputFieldElement.nativeElement.value;
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
