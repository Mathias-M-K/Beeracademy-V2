import {Component, input} from '@angular/core';

@Component({
  selector: 'app-participant-badge',
  imports: [],
  templateUrl: './participant-badge.html',
  styleUrl: './participant-badge.scss',
  host: {
    '[class.active]': 'isActive()',
    '[class.local]': '!isActive()',
  },
})
export class ParticipantBadge {
  readonly initials = input<string>('');
  readonly isActive = input<boolean>(false);

}
