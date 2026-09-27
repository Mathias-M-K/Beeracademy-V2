import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'gameTimeFormat',
})
export class GameTimeFormatPipe implements PipeTransform {
  transform(timer: number, format: string = 'HH:mm:ss.SSS'): string {
    const millis = Math.floor(timer % 1000);
    const seconds = Math.floor((timer / 1000) % 60);
    const minutes = Math.floor((timer / 1000 / 60) % 60);
    const hours = Math.floor(timer / 1000 / 60 / 60);

    const millisDigitCount = /S{2,}/.exec(format)?.[0].length ?? 0;
    const secondDigitCount = /s{2,}/.exec(format)?.[0].length ?? 0;
    const minuteDigitCount = /m{2,}/.exec(format)?.[0].length ?? 0;
    const hourDigitCount = /H{2,}/.exec(format)?.[0].length ?? 0;

    const millisStr = millis.toString().padStart(3, '0').slice(0, millisDigitCount);
    const secondStr = seconds.toString().padStart(secondDigitCount, '0');
    const minuteStr = minutes.toString().padStart(minuteDigitCount, '0');
    const hourStr = hours.toString().padStart(hourDigitCount, '0');

    let result = format;
    result = result.replace(/H{2,}/, hourStr);
    result = result.replace(/m{2,}/, minuteStr);
    result = result.replace(/s{2,}/, secondStr);
    result = result.replace(/S{2,}/, millisStr);

    return result;
  }
}
