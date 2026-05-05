import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../aead';
import { randomBytes, randomDek } from '../random';

const utf8 = (s: string) => new TextEncoder().encode(s);
const fromUtf8 = (b: Uint8Array) => new TextDecoder().decode(b);

describe('AEAD (XChaCha20-Poly1305-IETF)', () => {
  it('round-trips plaintext', async () => {
    const key = await randomDek();
    const aad = utf8('vault:1:0:0');
    const blob = await encrypt(utf8('hello world'), key, aad);
    const recovered = await decrypt(blob, key, aad);
    expect(fromUtf8(recovered)).toBe('hello world');
  });

  it('rejects tampered ciphertext', async () => {
    const key = await randomDek();
    const blob = await encrypt(utf8('secret'), key, null);
    blob.ciphertext[0] = blob.ciphertext[0]! ^ 0xff;
    await expect(decrypt(blob, key, null)).rejects.toThrow();
  });

  it('rejects wrong AAD (binding works)', async () => {
    const key = await randomDek();
    const blob = await encrypt(utf8('secret'), key, utf8('vault:1:5:0'));
    await expect(decrypt(blob, key, utf8('vault:1:6:0'))).rejects.toThrow();
  });

  it('rejects wrong key', async () => {
    const k1 = await randomDek();
    const k2 = await randomDek();
    const blob = await encrypt(utf8('secret'), k1, null);
    await expect(decrypt(blob, k2, null)).rejects.toThrow();
  });

  it('uses different ciphertexts for repeated encryption (random nonce)', async () => {
    const key = await randomDek();
    const a = await encrypt(utf8('same'), key, null);
    const b = await encrypt(utf8('same'), key, null);
    expect(a.nonce).not.toEqual(b.nonce);
    expect(a.ciphertext).not.toEqual(b.ciphertext);
  });

  it('produces a 24-byte nonce', async () => {
    const key = await randomDek();
    const blob = await encrypt(await randomBytes(8), key, null);
    expect(blob.nonce.length).toBe(24);
  });
});
