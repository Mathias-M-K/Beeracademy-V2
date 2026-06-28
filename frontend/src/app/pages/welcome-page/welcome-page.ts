import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {Router} from '@angular/router';
import {LobbyApi} from '../../services/lobby-api.service';

@Component({
  selector: 'app-welcome-page',
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WelcomePage {

  private readonly router: Router = inject(Router);
  private readonly lobbyService: LobbyApi = inject(LobbyApi);

  public onCreateLobby(lobbyName: string): void {
    this.lobbyService.createLobby(lobbyName).subscribe({
      next: () => this.navigateToLobbyPage()
    })
  }

  public onRegisterParticipant(participantName: string, lobbyId: string): void {
    this.lobbyService.fetchParticipantToken(lobbyId,participantName).subscribe({
      next: () => this.navigateToLobbyPage()
    })
  }

  public navigateToLobbyPage(): void {
    this.router.navigate(['/lobby'], { state: { joinAuto: true } });
  }

}
