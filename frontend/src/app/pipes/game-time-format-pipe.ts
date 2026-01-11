import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'gameTimeFormat',
})
export class GameTimeFormatPipe implements PipeTransform {

  transform(timer: number): string {

    const millis = timer % 1000;

    const seconds = Math.floor((timer / 1000) % 60);
    const minutes = Math.floor((timer / 1000 / 60) % 60);
    const hours = Math.floor(timer / 1000 / 60 / 60);

    const millisStr = millis.toString().padStart(3, '0');
    const secondStr = seconds.toString().padStart(2, '0');
    const minuteStr = minutes.toString().padStart(2, '0');
    const hourStr = hours.toString().padStart(2, '0');

    return `${hourStr}:${minuteStr}:${secondStr}.${millisStr}`;
  }

}
