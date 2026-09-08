import {Component, input, output} from '@angular/core';
import {GameTimeFormatPipe} from '../../../pipes/game-time-format-pipe';
import {TimerState} from '../../../../api-models/model/timerState';
import {GameInfo} from '../../../services/game/models/game-info';
import {MaterialIcon} from '../../../common/components/material-icon/material-icon';
import {IsGameOwnerDirective} from '../../../is-game-owner.directive';

@Component({
  selector: 'app-header',
  imports: [
    GameTimeFormatPipe,
    MaterialIcon,
    IsGameOwnerDirective
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {

  readonly gameInfo = input<GameInfo | undefined>();
  readonly gameTime = input<number>(0);
  readonly timerState = input<TimerState>(TimerState.NotStarted);
  readonly nrOfPlayers = input<number>(0);
  readonly currentRound = input<number>(0);

  readonly startClick = output<void>()
  readonly pauseClick = output<void>();
  readonly resumeClick = output<void>();
  readonly playerOverviewClick = output<void>();

  protected readonly TimerState = TimerState;
}
