// Branded byte vectors. Two values with the same runtime shape (Uint8Array)
// but different brands cannot be assigned to each other — this prevents
// accidentally passing a DEK where a KEK is expected, etc.

export type Bytes = Uint8Array;

declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

export type KEK = Brand<Bytes, 'KEK'>;
export type DEK = Brand<Bytes, 'DEK'>;
export type PublicKey = Brand<Bytes, 'PublicKey'>;
export type SecretKey = Brand<Bytes, 'SecretKey'>;
export type Salt = Brand<Bytes, 'Salt'>;
export type Nonce = Brand<Bytes, 'Nonce'>;

export type Keypair = {
  publicKey: PublicKey;
  secretKey: SecretKey;
};

export type Argon2Params = {
  // libsodium uses opslimit (iterations) + memlimit (bytes).
  opslimit: number;
  memlimit: number;
  // Frozen at value-time so we can migrate algorithms without breaking old vaults.
  algorithm: 'argon2id13';
};

// Desktop default. Mobile (iOS especially) cannot afford 256 MB during KDF —
// we will derive a separate, lower-memory profile when the mobile codebase lands.
export const DESKTOP_ARGON2_PARAMS: Argon2Params = {
  opslimit: 3,
  memlimit: 256 * 1024 * 1024,
  algorithm: 'argon2id13',
};
