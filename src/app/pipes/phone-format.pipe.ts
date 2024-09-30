import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phoneFormat'
})
export class PhoneFormatPipe implements PipeTransform {

    transform(value: string): string {
        if (!value) {
          return '';
        }
        // Asumiendo que el número de teléfono siempre tiene 10 dígitos
        const areaCode = value.slice(0, 3);
        const middle = value.slice(3, 6);
        const last = value.slice(6, 10);
    
        return `(${areaCode}) ${middle}-${last}`;
      }

}
