import { Component, computed, inject } from '@angular/core';
import { GameService } from '../../../services/game/game.service';
import { DecimalPipe } from '@angular/common';

@Component({
  imports: [DecimalPipe],
  selector: 'app-card-chance-overview',
  styleUrl: './card-chance-overview.scss',
  templateUrl: './card-chance-overview.html',
})
export class CardChanceOverview {
  private readonly gameService = inject(GameService);

  protected readonly remainingCards = this.gameService.remainingCardsByRank;
  protected remainingCardsCount = computed(() =>
    this.remainingCards().reduce((sum, rankCount) => sum + (rankCount.count ?? 0), 0),
  );
  protected readonly cardMaxCount = this.gameService.players().length;
}
