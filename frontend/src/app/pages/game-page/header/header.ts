import {Component, input, output} from '@angular/core';
import {GameTimeFormatPipe} from '../../../pipes/game-time-format-pipe';
import {TimerState} from '../../../../api-models/model/timerState';
import {GameInfo} from '../../../services/game/models/game-info';

@Component({
  selector: 'app-header',
  imports: [
    GameTimeFormatPipe
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {

  readonly gameInfo = input<GameInfo | undefined>();
  readonly gameTime = input<number>(0);
  readonly timerState = input<TimerState>(TimerState.NotStarted);

  readonly startClick = output<void>()
  readonly pauseClick = output<void>();
  readonly resumeClick = output<void>();

  protected readonly TimerState = TimerState;
}
