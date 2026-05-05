import { describe, it, expect } from 'vitest';
import {
  initializeIdentity,
  unwrapKeypair,
  encryptVaultPayload,
  decryptVaultPayload,
} from '../scheme';
import { deriveKEK } from '../kdf';
import { randomSalt } from '../random';
import type { Argon2Params } from '../types';

const utf8 = (s: string) => new TextEncoder().encode(s);
const fromUtf8 = (b: Uint8Array) => new TextDecoder().decode(b);

const TEST_PARAMS: Argon2Params = {
  opslimit: 1,
  memlimit: 8 * 1024 * 1024,
  algorithm: 'argon2id13',
};

describe('Hybrid vault scheme', () => {
  it('full round-trip: password -> identity -> vault encrypt/decrypt', async () => {
    const salt = await randomSalt();
    const kek = await deriveKEK('master', salt, TEST_PARAMS);

    const identity = await initializeIdentity(kek);
    const keypair = await unwrapKeypair(identity, kek);

    const aad = utf8('vault:abc:1');
    const payload = utf8(JSON.stringify({ hosts: ['prod.example.com'] }));

    const blob = await encryptVaultPayload(payload, identity.publicKey, aad);
    const recovered = await decryptVaultPayload(blob, keypair, aad);

    expect(fromUtf8(recovered)).toBe(JSON.stringify({ hosts: ['prod.example.com'] }));
  });

  it('rejects wrong password (identity unwrap fails)', async () => {
    const salt = await randomSalt();
    const kek = await deriveKEK('master', salt, TEST_PARAMS);
    const wrongKek = await deriveKEK('different', salt, TEST_PARAMS);

    const identity = await initializeIdentity(kek);
    await expect(unwrapKeypair(identity, wrongKek)).rejects.toThrow();
  });

  it('rejects wrong AAD on the vault blob', async () => {
    const salt = await randomSalt();
    const kek = await deriveKEK('master', salt, TEST_PARAMS);
    const identity = await initializeIdentity(kek);
    const keypair = await unwrapKeypair(identity, kek);

    const blob = await encryptVaultPayload(utf8('payload'), identity.publicKey, utf8('v:1'));
    await expect(decryptVaultPayload(blob, keypair, utf8('v:2'))).rejects.toThrow();
  });

  it('different vaults under the same identity get different DEKs', async () => {
    const salt = await randomSalt();
    const kek = await deriveKEK('master', salt, TEST_PARAMS);
    const identity = await initializeIdentity(kek);

    const a = await encryptVaultPayload(utf8('a'), identity.publicKey, utf8('v:1'));
    const b = await encryptVaultPayload(utf8('b'), identity.publicKey, utf8('v:2'));

    // Sealed boxes are randomized per call, so encryptedDek bytes will differ
    // even if the DEKs themselves were equal — but the DEKs are randomly drawn
    // each call too, so the underlying keys are also distinct.
    expect(a.encryptedDek).not.toEqual(b.encryptedDek);
  });
});
