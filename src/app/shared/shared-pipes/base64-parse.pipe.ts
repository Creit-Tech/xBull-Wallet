import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'base64Parse'
})
export class Base64ParsePipe implements PipeTransform {

  transform(value: string | Buffer): unknown {
    if (typeof value === 'string') {
      return atob(value);
    } else {
      return atob(value.toString());
    }
  }

}
