import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'publicKey'
})
export class PublicKeyPipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): string {
    if (!!value) {
      return `${value.slice(0, 4)}....${value.slice(-8)}`;
    } else {
      return '';
    }
  }
}
