import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'gameId',
})
export class GameIdPipe implements PipeTransform {

  //TODO 100p someone can do better than this
  transform(gameId: string): string {
    if (!gameId) {return ''}
    if(gameId.length !== 9){return gameId}

    const part1 = gameId.substring(0,3);
    const part2 = gameId.substring(3,6);
    const part3 = gameId.substring(6,9);

    return part1 + '-' + part2 + '-' + part3;
  }

}
