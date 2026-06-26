import {Component, input} from '@angular/core';

@Component({
  selector: 'app-lobby-info-quick',
  templateUrl: './lobby-info-quick.html',
  styleUrl: './lobby-info-quick.scss',
  standalone: true
})
export class LobbyInfoQuick {

  readonly lobbyId = input<string>('-');

}
