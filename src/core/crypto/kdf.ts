import { getSodium } from './sodium';
import { DESKTOP_ARGON2_PARAMS } from './types';
import type { KEK, Salt, Argon2Params } from './types';

// Derive a 256-bit key-encryption key (KEK) from the user's master password
// using Argon2id. Default parameters target desktop; pass a smaller profile
// on memory-constrained platforms.

const KEK_BYTES = 32;

export const deriveKEK = async (
  password: string,
  salt: Salt,
  params: Argon2Params = DESKTOP_ARGON2_PARAMS,
): Promise<KEK> => {
  const sodium = await getSodium();
  const key = sodium.crypto_pwhash(
    KEK_BYTES,
    password,
    salt,
    params.opslimit,
    params.memlimit,
    sodium.crypto_pwhash_ALG_ARGON2ID13,
  );
  return key as KEK;
};
