import { describe, it, expect } from 'vitest';
import { deriveKEK } from '../kdf';
import { randomSalt } from '../random';
import type { Argon2Params } from '../types';

// Use very low parameters for tests so they finish quickly. The product code
// uses DESKTOP_ARGON2_PARAMS (256 MB / t=3) by default.
const TEST_PARAMS: Argon2Params = {
  opslimit: 1,
  memlimit: 8 * 1024 * 1024,
  algorithm: 'argon2id13',
};

describe('KDF (Argon2id)', () => {
  it('produces a 32-byte key', async () => {
    const salt = await randomSalt();
    const kek = await deriveKEK('correct horse battery staple', salt, TEST_PARAMS);
    expect(kek.length).toBe(32);
  });

  it('is deterministic for the same password + salt + params', async () => {
    const salt = await randomSalt();
    const a = await deriveKEK('passphrase', salt, TEST_PARAMS);
    const b = await deriveKEK('passphrase', salt, TEST_PARAMS);
    expect(a).toEqual(b);
  });

  it('produces different keys for different salts', async () => {
    const salt1 = await randomSalt();
    const salt2 = await randomSalt();
    const a = await deriveKEK('passphrase', salt1, TEST_PARAMS);
    const b = await deriveKEK('passphrase', salt2, TEST_PARAMS);
    expect(a).not.toEqual(b);
  });

  it('produces different keys for different passwords', async () => {
    const salt = await randomSalt();
    const a = await deriveKEK('one', salt, TEST_PARAMS);
    const b = await deriveKEK('two', salt, TEST_PARAMS);
    expect(a).not.toEqual(b);
  });
});
