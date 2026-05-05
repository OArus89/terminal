import { getSodium } from './sodium';
import type { Bytes, Keypair, PublicKey, SecretKey } from './types';

// X25519 keypair used for sealed-box encryption of the per-vault DEK.
// Sealed boxes hide the sender (perfect for self-encryption — there is no
// "sender" identity, only the recipient public key).

export const generateKeypair = async (): Promise<Keypair> => {
  const sodium = await getSodium();
  const kp = sodium.crypto_box_keypair();
  return {
    publicKey: kp.publicKey as PublicKey,
    secretKey: kp.privateKey as SecretKey,
  };
};

export const sealedEncrypt = async (
  plaintext: Bytes,
  recipientPublicKey: PublicKey,
): Promise<Bytes> => {
  const sodium = await getSodium();
  return sodium.crypto_box_seal(plaintext, recipientPublicKey);
};

export const sealedDecrypt = async (
  ciphertext: Bytes,
  recipientPublicKey: PublicKey,
  recipientSecretKey: SecretKey,
): Promise<Bytes> => {
  const sodium = await getSodium();
  return sodium.crypto_box_seal_open(ciphertext, recipientPublicKey, recipientSecretKey);
};
