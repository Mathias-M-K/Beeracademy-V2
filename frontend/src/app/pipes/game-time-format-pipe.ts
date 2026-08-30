import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'gameTimeFormat',
})
export class GameTimeFormatPipe implements PipeTransform {

  transform(timer: number, format: string = 'HH:mm:ss.SSS'): string {

    const millis = timer % 1000;
    const seconds = Math.floor((timer / 1000) % 60);
    const minutes = Math.floor((timer / 1000 / 60) % 60);
    const hours = Math.floor(timer / 1000 / 60 / 60);

    const millisStr = millis.toString().padStart(3, '0');
    const secondStr = seconds.toString().padStart(2, '0');
    const minuteStr = minutes.toString().padStart(2, '0');
    const hourStr = hours.toString().padStart(2, '0');

    let result = format;
    result = result.replace('HH', hourStr);
    result = result.replace('mm', minuteStr);
    result = result.replace('ss', secondStr);
    result = result.replace('SSS', millisStr);

    return result;
  }

}
