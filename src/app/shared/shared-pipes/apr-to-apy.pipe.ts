import { Pipe, PipeTransform } from '@angular/core';
import BigNumber from 'bignumber.js';

@Pipe({
  name: 'aprToApy'
})
export class AprToApyPipe implements PipeTransform {

  transform(value: number, frequency: number): number {
    return new BigNumber('1')
      .plus(
        new BigNumber(value)
          .dividedBy(frequency)
      )
      .exponentiatedBy(frequency)
      .minus('1')
      .toNumber();
  }

}
