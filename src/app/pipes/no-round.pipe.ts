import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'noRound'
})
export class NoRoundPipe implements PipeTransform {
  transform(value: number, decimalPlaces: number = 2): string {
    if (isNaN(value) || !isFinite(value)) return '';

    const [intPart, fracPart = ''] = value.toString().split('.');
    const truncated = fracPart.substring(0, decimalPlaces).padEnd(decimalPlaces, '0');

    return `${intPart}.${truncated}`;
  }
}