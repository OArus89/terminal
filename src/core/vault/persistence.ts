import { Vault } from './vault';
import {
  encryptVaultPayload,
  decryptVaultPayload,
  type VaultBlob,
  type Keypair,
  type PublicKey,
} from '../crypto';

// AAD for vault snapshots binds the ciphertext to its identity (vaultId) and
// monotonic version. An attacker swapping a valid blob from a different vault
// or rolling the version back will fail decryption.
const buildAad = (vaultId: string, version: number): Uint8Array =>
  new TextEncoder().encode(`vault:${vaultId}:${version}`);

export const saveVaultEncrypted = (
  vault: Vault,
  identityPublicKey: PublicKey,
  vaultId: string,
  version: number,
): Promise<VaultBlob> => {
  const bytes = vault.save();
  return encryptVaultPayload(bytes, identityPublicKey, buildAad(vaultId, version));
};

export const loadVaultEncrypted = async (
  blob: VaultBlob,
  keypair: Keypair,
  vaultId: string,
  version: number,
): Promise<Vault> => {
  const bytes = await decryptVaultPayload(blob, keypair, buildAad(vaultId, version));
  return Vault.load(bytes);
};
