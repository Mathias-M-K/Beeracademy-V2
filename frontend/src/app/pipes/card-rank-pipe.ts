import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cardRank',
})
export class CardRankPipe implements PipeTransform {
  transform(rank: number): unknown {
    switch (rank) {
      case 11:
        return 'J';
      case 12:
        return 'D';
      case 13:
        return 'K';
      case 14:
        return 'A';
      default:
        return rank;
    }
  }
}
