import { describe, it, expect } from 'vitest';
import { Vault } from '../vault';
import type { AddHostInput } from '../types';

const seedHost = (overrides: Partial<AddHostInput> = {}): AddHostInput => ({
  label: 'host',
  hostname: 'example.com',
  port: 22,
  protocol: 'ssh',
  identityId: null,
  groupId: null,
  jumpHostId: null,
  tags: [],
  ...overrides,
});

// These tests model two devices ("phone" / "laptop") diverging offline and
// then syncing. We use Vault.fork() to materialize a second replica, then
// drive each side independently and merge.

describe('Vault — CRDT merge', () => {
  it('disjoint adds on two replicas survive the merge', () => {
    const phone = Vault.create();
    const laptop = phone.fork();

    phone.addHost(seedHost({ label: 'from-phone' }));
    laptop.addHost(seedHost({ label: 'from-laptop' }));

    phone.merge(laptop);

    const labels = phone.listHosts().map((h) => h.label).sort();
    expect(labels).toEqual(['from-laptop', 'from-phone']);
  });

  it('add on one side + delete-of-different-host on the other both survive', () => {
    const root = Vault.create();
    const aId = root.addHost(seedHost({ label: 'A' }));

    const phone = root.fork();
    const laptop = root.fork();

    phone.deleteHost(aId);
    laptop.addHost(seedHost({ label: 'B' }));

    phone.merge(laptop);

    const labels = phone.listHosts().map((h) => h.label).sort();
    expect(labels).toEqual(['B']);
  });

  it('concurrent updates to the same field resolve deterministically', () => {
    const root = Vault.create();
    const id = root.addHost(seedHost({ label: 'A' }));

    const phone = root.fork();
    const laptop = root.fork();

    phone.updateHost(id, { label: 'phone-edit' });
    laptop.updateHost(id, { label: 'laptop-edit' });

    phone.merge(laptop);
    laptop.merge(phone);

    // Whatever Automerge picks must be one of the two and identical on both sides.
    const phoneLabel = phone.getHost(id)?.label;
    const laptopLabel = laptop.getHost(id)?.label;
    expect(phoneLabel).toBe(laptopLabel);
    expect(['phone-edit', 'laptop-edit']).toContain(phoneLabel);
  });

  it('merge converges regardless of order', () => {
    const root = Vault.create();
    const aId = root.addHost(seedHost({ label: 'A' }));

    const phone = root.fork();
    const laptop = root.fork();

    phone.updateHost(aId, { tags: ['phone'] });
    laptop.addHost(seedHost({ label: 'B' }));

    const merged1 = phone.fork();
    merged1.merge(laptop);

    const merged2 = laptop.fork();
    merged2.merge(phone);

    expect(merged1.listHosts().map((h) => h.label).sort()).toEqual(
      merged2.listHosts().map((h) => h.label).sort(),
    );
    expect(merged1.getHost(aId)?.tags).toEqual(merged2.getHost(aId)?.tags);
  });
});
