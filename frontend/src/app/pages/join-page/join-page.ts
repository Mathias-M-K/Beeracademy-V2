import {Component, computed, DestroyRef, inject, signal} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {LobbyApi} from '../../services/lobby-api.service';
import {LobbyDTO} from '../../../api-models/model/lobbyDTO';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-join-page',
  imports: [
    FormsModule
  ],
  templateUrl: './join-page.html',
  styleUrl: './join-page.scss',
})
export class JoinPage {

  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly lobbyApi = inject(LobbyApi);
  readonly destroyRef = inject(DestroyRef);

  readonly lobbyName = signal<string>('');
  readonly alreadyJoined = signal<number>(0);
  private lobbyId: string = '';

  readonly participantName = signal<string>('');
  readonly nameOk = computed(()=>{
    return this.participantName().trim().length > 0;
  })

  constructor() {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params: Params) => this.getLobbyInfo(params['lobby-id']));
  }

  private getLobbyInfo(lobbyId: string){
    console.debug('Fetching lobby info from lobby-id ', lobbyId);
    this.lobbyApi.getLobby(lobbyId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: LobbyDTO) => {
        console.log('LobbyDTO', data);
        this.lobbyId = lobbyId;
        this.lobbyName.set(data.name??'');
        this.alreadyJoined.set(data.participants?.length??0);
      },
    })
  }

  getParticipantToken(participantName: string){
    this.lobbyApi.fetchParticipantToken(this.lobbyId, participantName).subscribe({
      next: () => this.router.navigate(['/lobby']),
    })
  }
}
