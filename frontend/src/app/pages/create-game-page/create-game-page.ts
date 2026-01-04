import {Component, ElementRef, HostListener, signal, ViewChild} from '@angular/core';
import {BeerAcademyService} from '../../services/beer-academy.service';

@Component({
  selector: 'app-create-game-page',
  imports: [],
  templateUrl: './create-game-page.html',
  styleUrl: './create-game-page.scss',
})
export class CreateGamePage {

  @ViewChild('playerInputField')
  private playerInputFieldElement!: ElementRef;

  protected players = signal<string[]>([]);

  constructor(private beerAcademyService: BeerAcademyService) {
  }

  protected createGame(){
    this.beerAcademyService.createGame(this.players(),"test")
  }

  protected addPlayer(playerName: string) : void{
      this.players.update((players) => [...players, playerName]);
      this.playerInputFieldElement.nativeElement.value = '';
  }

  private fetchInputFieldValue(): string {
    return this.playerInputFieldElement.nativeElement.value;
  }

  private resetInputField(): void {
    this.playerInputFieldElement.nativeElement.value = '';
  }

  @HostListener('keydown.enter', ['$event'])
  onEnterClick(event: Event) {
      const inputFieldVal = this.fetchInputFieldValue();
      this.addPlayer(inputFieldVal);

      this.resetInputField();
  }



}
