import { describe, it, expect } from 'vitest';
import { Vault } from '../vault';
import type { AddHostInput, AddIdentityInput, AddGroupInput } from '../types';

const seedHost = (overrides: Partial<AddHostInput> = {}): AddHostInput => ({
  label: 'prod',
  hostname: 'prod.example.com',
  port: 22,
  protocol: 'ssh',
  identityId: null,
  groupId: null,
  jumpHostId: null,
  tags: [],
  ...overrides,
});

const seedIdentity = (overrides: Partial<AddIdentityInput> = {}): AddIdentityInput => ({
  label: 'root',
  username: 'root',
  authMethod: 'key',
  keychainEntryId: null,
  ...overrides,
});

const seedGroup = (overrides: Partial<AddGroupInput> = {}): AddGroupInput => ({
  name: 'production',
  parentGroupId: null,
  defaultIdentityId: null,
  defaultPort: null,
  ...overrides,
});

describe('Vault — CRUD', () => {
  it('create() yields an empty vault', () => {
    const v = Vault.create();
    expect(v.listHosts()).toEqual([]);
    expect(v.listGroups()).toEqual([]);
    expect(v.listIdentities()).toEqual([]);
  });

  it('addHost returns an id and the host is retrievable', () => {
    const v = Vault.create();
    const id = v.addHost(seedHost());
    const host = v.getHost(id);
    expect(host).not.toBeNull();
    expect(host?.label).toBe('prod');
    expect(host?.id).toBe(id);
    expect(host?.createdAt).toBeGreaterThan(0);
  });

  it('updateHost patches fields and bumps updatedAt', async () => {
    const v = Vault.create();
    const id = v.addHost(seedHost());
    const before = v.getHost(id);
    await new Promise((r) => setTimeout(r, 5));
    v.updateHost(id, { label: 'production-1' });
    const after = v.getHost(id);
    expect(after?.label).toBe('production-1');
    expect(after?.updatedAt).toBeGreaterThanOrEqual(before?.updatedAt ?? 0);
  });

  it('deleteHost removes it', () => {
    const v = Vault.create();
    const id = v.addHost(seedHost());
    v.deleteHost(id);
    expect(v.getHost(id)).toBeNull();
    expect(v.listHosts()).toHaveLength(0);
  });

  it('getHost returns null for unknown id', () => {
    const v = Vault.create();
    expect(v.getHost('does-not-exist')).toBeNull();
  });

  it('addIdentity / addGroup behave like hosts', () => {
    const v = Vault.create();
    const idA = v.addIdentity(seedIdentity());
    const idG = v.addGroup(seedGroup());
    expect(v.getIdentity(idA)?.username).toBe('root');
    expect(v.getGroup(idG)?.name).toBe('production');
  });

  it('save/load round-trip preserves state', () => {
    const v = Vault.create();
    const idA = v.addHost(seedHost({ label: 'web-1' }));
    const idB = v.addHost(seedHost({ label: 'web-2' }));
    const idG = v.addGroup(seedGroup());
    v.updateHost(idA, { groupId: idG });

    const bytes = v.save();
    const restored = Vault.load(bytes);

    expect(restored.listHosts().map((h) => h.label).sort()).toEqual(['web-1', 'web-2']);
    expect(restored.getHost(idA)?.groupId).toBe(idG);
    expect(restored.getGroup(idG)?.name).toBe('production');
    expect(restored.getHost(idB)?.label).toBe('web-2');
  });

  it('fork yields an independent copy', () => {
    const v = Vault.create();
    const id = v.addHost(seedHost());
    const f = v.fork();
    f.updateHost(id, { label: 'forked' });
    expect(v.getHost(id)?.label).toBe('prod');
    expect(f.getHost(id)?.label).toBe('forked');
  });
});
