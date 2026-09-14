import {Component, inject, signal} from '@angular/core';
import {DrawerDefaultHeaderComponent} from '../common/drawer-default-header/drawer-default-header.component';
import {OverlayHandle} from '../../services/overlay/models/overlay-handle';
import {CdkTrapFocus} from '@angular/cdk/a11y';
import {form, FormField, minLength, required} from '@angular/forms/signals';
import {ReactiveFormsModule} from '@angular/forms';
import {uniqueNameValidator} from '../../validators/uniqueNameValidator';
import {LobbyService} from '../../services/lobby/lobby.service';

@Component({
  imports: [
    DrawerDefaultHeaderComponent,
    CdkTrapFocus,
    ReactiveFormsModule,
    FormField
  ],
  selector: 'app-new-participant-drawer',
  styleUrl: './new-participant-drawer.component.scss',
  templateUrl: './new-participant-drawer.component.html',
})
export class NewParticipantDrawerComponent {
  private readonly overlayHandle = inject(OverlayHandle);
  private readonly lobbyService = inject(LobbyService);

  protected newParticipantModel = signal({'participantName': ''});
  protected readonly newParticipantForm = form(this.newParticipantModel, (model) => {
    required(model.participantName);
    minLength(model.participantName, 2);
    uniqueNameValidator(model.participantName, this.lobbyService.participants().map(participant => participant.name ?? ''));
  });


  protected addParticipant(participantName: string) {
    if (this.newParticipantForm().invalid()) return;
    this.overlayHandle.close(participantName);
  }
}
