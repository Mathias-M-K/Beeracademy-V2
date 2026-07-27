import {Component, computed, input} from '@angular/core';
import {RANK_DISPLAY} from '../../../services/game/models/rank-display';
import {RankCountDto} from '../../../../api-models/model/rankCountDto';

@Component({
  selector: 'app-card-count',
  imports: [],
  templateUrl: './card-count.html',
  styleUrl: './card-count.scss',
})
export class CardCount {

  cards = input.required<RankCountDto[]>();
  maxCardsPrRank = input.required<number>();

  protected maxNrOfCards = computed(() => {
    const nrOfCardsInASuit = 13;
    return this.maxCardsPrRank() * nrOfCardsInASuit;
  });

  protected cardsLeft = computed(() =>
    this.cards().reduce((sum, card) => sum + (card.count ?? 0), 0),
  );

  protected readonly RANK_DISPLAY = RANK_DISPLAY;
}
