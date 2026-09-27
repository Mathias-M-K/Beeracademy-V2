import {Component, computed, inject} from '@angular/core';
import {GameService} from '../../../services/game/game.service';
import {GameTimeFormatPipe} from '../../../pipes/game-time-format-pipe';
import {Dot} from '../../../common/dot/dot';
import {playerColor} from '../../../common/theme/player-colors';
import {PlayerTurn} from '../../../services/game/models/playerTurn';
import {SuitIcon} from '../../../common/components/suit-icon/suit-icon';

interface Round {
  roundNr: number;
  turns: PlayerTurn[];
}

@Component({
  imports: [GameTimeFormatPipe, Dot, SuitIcon],
  selector: 'app-round-history',
  styleUrl: './round-history.scss',
  templateUrl: './round-history.html',
})
export class RoundHistory {
  private readonly gameService = inject(GameService);

  protected readonly turns = this.gameService.turns;
  protected readonly rounds = computed(() => {

    const roundsRaw = this.turns().map(turn => turn.info.round ?? 0);
    const rounds = [...new Set(roundsRaw)];

    return rounds.map(round => {
      const turns = this.turns().filter(turn => turn.info.round === round);
      const newRound: Round = {
        roundNr: round,
        turns: turns
      }
      return newRound;
    })
  })


  protected readonly playerColor = playerColor;
}
