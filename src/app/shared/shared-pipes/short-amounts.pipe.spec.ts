import { ShortAmountsPipe } from './short-amounts.pipe';

describe('ShortAmountsPipe', () => {
  it('create an instance', () => {
    const pipe = new ShortAmountsPipe();
    expect(pipe).toBeTruthy();
  });
});
