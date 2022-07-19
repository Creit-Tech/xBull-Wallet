import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'publicKey'
})
export class PublicKeyPipe implements PipeTransform {

  transform(value: string | undefined | null, ...args: unknown[]): string {
    if (!!value) {
      return `${value.slice(0, 4)}....${value.slice(-6)}`;
    } else {
      return '';
    }
  }
}
