import { getSodium } from './sodium';
import { randomAeadNonce } from './random';
import type { Bytes, Nonce } from './types';

// XChaCha20-Poly1305-IETF: 256-bit key, 192-bit nonce (safe to randomize),
// Poly1305 auth tag (16 bytes), supports AAD.

export type EncryptedBlob = {
  nonce: Nonce;
  ciphertext: Bytes;
};

export const encrypt = async (
  plaintext: Bytes,
  key: Bytes,
  associatedData: Bytes | null,
  nonce?: Nonce,
): Promise<EncryptedBlob> => {
  const sodium = await getSodium();
  const actualNonce = nonce ?? (await randomAeadNonce());
  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    plaintext,
    associatedData,
    null,
    actualNonce,
    key,
  );
  return { nonce: actualNonce, ciphertext };
};

export const decrypt = async (
  blob: EncryptedBlob,
  key: Bytes,
  associatedData: Bytes | null,
): Promise<Bytes> => {
  const sodium = await getSodium();
  return sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    blob.ciphertext,
    associatedData,
    blob.nonce,
    key,
  );
};
