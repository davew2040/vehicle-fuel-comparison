import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'trailingDecimals',
  standalone: true
})
export class TrailingDecimalsPipe implements PipeTransform {
  transform(value: number | null): string {
    if (value === null) return '';
    let str = value.toFixed(6); // Ensure at least 6 decimal places
    return str.slice(str.indexOf('.') + 3, str.indexOf('.') + 5); // Extract 3rd to 6th decimal places
  }
}