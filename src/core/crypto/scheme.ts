import { encrypt, decrypt, type EncryptedBlob } from './aead';
import { generateKeypair, sealedEncrypt, sealedDecrypt } from './keypair';
import { randomDek } from './random';
import type { Bytes, KEK, Keypair, PublicKey, SecretKey } from './types';

// High-level hybrid scheme:
//
//   1. master password + salt --Argon2id--> KEK
//   2. random X25519 keypair; secretKey is AEAD-encrypted with KEK -> IdentityBlob
//   3. random per-vault DEK; DEK is sealed-box encrypted to the user's publicKey
//   4. vault payload is AEAD-encrypted with DEK and bound to AAD
//
// This decouples password (rotateable cheaply) from data key (rotate when
// you suspect data compromise) from vault payload (the biggest blob).

export type IdentityBlob = {
  publicKey: PublicKey;
  encryptedSecretKey: EncryptedBlob;
};

export type VaultBlob = {
  // sealed-box encrypted DEK (encrypted to identity public key)
  encryptedDek: Bytes;
  // AEAD-encrypted payload bound to AAD
  encryptedPayload: EncryptedBlob;
};

export const initializeIdentity = async (kek: KEK): Promise<IdentityBlob> => {
  const keypair = await generateKeypair();
  const encryptedSecretKey = await encrypt(keypair.secretKey, kek, null);
  return {
    publicKey: keypair.publicKey,
    encryptedSecretKey,
  };
};

export const unwrapKeypair = async (identity: IdentityBlob, kek: KEK): Promise<Keypair> => {
  const secretKey = (await decrypt(identity.encryptedSecretKey, kek, null)) as SecretKey;
  return {
    publicKey: identity.publicKey,
    secretKey,
  };
};

export const encryptVaultPayload = async (
  payload: Bytes,
  identityPublicKey: PublicKey,
  associatedData: Bytes,
): Promise<VaultBlob> => {
  const dek = await randomDek();
  const encryptedDek = await sealedEncrypt(dek, identityPublicKey);
  const encryptedPayload = await encrypt(payload, dek, associatedData);
  return { encryptedDek, encryptedPayload };
};

export const decryptVaultPayload = async (
  blob: VaultBlob,
  keypair: Keypair,
  associatedData: Bytes,
): Promise<Bytes> => {
  const dek = await sealedDecrypt(blob.encryptedDek, keypair.publicKey, keypair.secretKey);
  return decrypt(blob.encryptedPayload, dek, associatedData);
};
