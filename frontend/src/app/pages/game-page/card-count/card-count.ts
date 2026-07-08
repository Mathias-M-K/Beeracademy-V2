import {Component} from '@angular/core';
import {RANK_DISPLAY} from '../../../services/game/models/rank-display';

@Component({
  selector: 'app-card-count',
  imports: [],
  templateUrl: './card-count.html',
  styleUrl: './card-count.scss',
})
export class CardCount {

  private readonly ranks: number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  readonly cardCount: Map<number, number> = new Map();

  constructor() {

    this.ranks.forEach(rank => {
      this.cardCount.set(rank,14);
    })
  }

  protected readonly RANK_DISPLAY = RANK_DISPLAY;
}
