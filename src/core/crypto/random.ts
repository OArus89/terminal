import { getSodium } from './sodium';
import type { Bytes, Salt, Nonce, DEK } from './types';

export const randomBytes = async (length: number): Promise<Bytes> => {
  const sodium = await getSodium();
  return sodium.randombytes_buf(length);
};

export const randomSalt = async (): Promise<Salt> => {
  const sodium = await getSodium();
  return sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES) as Salt;
};

export const randomAeadNonce = async (): Promise<Nonce> => {
  const sodium = await getSodium();
  return sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES) as Nonce;
};

export const randomDek = async (): Promise<DEK> => {
  const sodium = await getSodium();
  return sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES) as DEK;
};
