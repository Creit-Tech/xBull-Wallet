import { Base64ParsePipe } from './base64-parse.pipe';

describe('Base64ParsePipe', () => {
  it('create an instance', () => {
    const pipe = new Base64ParsePipe();
    expect(pipe).toBeTruthy();
  });
});
