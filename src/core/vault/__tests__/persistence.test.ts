import { describe, it, expect } from 'vitest';
import { Vault } from '../vault';
import { saveVaultEncrypted, loadVaultEncrypted } from '../persistence';
import { initializeIdentity, unwrapKeypair } from '../../crypto/scheme';
import { deriveKEK } from '../../crypto/kdf';
import { randomSalt } from '../../crypto/random';
import type { Argon2Params } from '../../crypto/types';

const TEST_PARAMS: Argon2Params = {
  opslimit: 1,
  memlimit: 8 * 1024 * 1024,
  algorithm: 'argon2id13',
};

const VAULT_ID = 'vault-test';

describe('Vault — encrypted persistence', () => {
  it('encrypt → decrypt round-trips the vault state', async () => {
    const salt = await randomSalt();
    const kek = await deriveKEK('master', salt, TEST_PARAMS);
    const identity = await initializeIdentity(kek);
    const keypair = await unwrapKeypair(identity, kek);

    const vault = Vault.create();
    const id = vault.addHost({
      label: 'prod',
      hostname: 'prod.example.com',
      port: 22,
      protocol: 'ssh',
      identityId: null,
      groupId: null,
      jumpHostId: null,
      tags: ['critical'],
    });

    const blob = await saveVaultEncrypted(vault, identity.publicKey, VAULT_ID, 1);
    const restored = await loadVaultEncrypted(blob, keypair, VAULT_ID, 1);

    const host = restored.getHost(id);
    expect(host?.hostname).toBe('prod.example.com');
    expect(host?.tags).toEqual(['critical']);
  });

  it('rejects decryption with a stale version number (anti-rollback)', async () => {
    const salt = await randomSalt();
    const kek = await deriveKEK('master', salt, TEST_PARAMS);
    const identity = await initializeIdentity(kek);
    const keypair = await unwrapKeypair(identity, kek);

    const vault = Vault.create();
    const blob = await saveVaultEncrypted(vault, identity.publicKey, VAULT_ID, 5);

    await expect(loadVaultEncrypted(blob, keypair, VAULT_ID, 4)).rejects.toThrow();
    await expect(loadVaultEncrypted(blob, keypair, VAULT_ID, 6)).rejects.toThrow();
  });

  it('rejects decryption with a different vault id', async () => {
    const salt = await randomSalt();
    const kek = await deriveKEK('master', salt, TEST_PARAMS);
    const identity = await initializeIdentity(kek);
    const keypair = await unwrapKeypair(identity, kek);

    const vault = Vault.create();
    const blob = await saveVaultEncrypted(vault, identity.publicKey, 'vault-A', 1);

    await expect(loadVaultEncrypted(blob, keypair, 'vault-B', 1)).rejects.toThrow();
  });
});
