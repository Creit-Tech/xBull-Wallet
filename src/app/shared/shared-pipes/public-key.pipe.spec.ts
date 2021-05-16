import { PublicKeyPipe } from './public-key.pipe';

describe('PublicKeyPipe', () => {
  it('create an instance', () => {
    const pipe = new PublicKeyPipe();
    expect(pipe).toBeTruthy();
  });
});
