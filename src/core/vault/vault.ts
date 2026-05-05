import { next as Automerge, type Doc } from '@automerge/automerge';
import type {
  VaultDoc,
  Host,
  Group,
  Identity,
  HostId,
  GroupId,
  IdentityId,
  AddHostInput,
  UpdateHostInput,
  AddGroupInput,
  UpdateGroupInput,
  AddIdentityInput,
  UpdateIdentityInput,
} from './types';

const now = (): number => Date.now();
const newId = (): string => globalThis.crypto.randomUUID();

const emptyVaultDoc = (): VaultDoc => ({
  hosts: {},
  groups: {},
  identities: {},
});

// Vault is a thin facade over an Automerge document. All mutations go through
// Automerge.change() so the operation log can be merged with concurrent edits
// from other devices. The doc is reassigned (not mutated in place) — Automerge
// docs are immutable from the outside.

export class Vault {
  private constructor(private doc: Doc<VaultDoc>) {}

  static create(): Vault {
    return new Vault(Automerge.from(emptyVaultDoc()));
  }

  static load(bytes: Uint8Array): Vault {
    return new Vault(Automerge.load<VaultDoc>(bytes));
  }

  save(): Uint8Array {
    return Automerge.save(this.doc);
  }

  // CRDT merge: fold another vault's history into this one.
  merge(other: Vault): void {
    this.doc = Automerge.merge(this.doc, other.doc);
  }

  // Independent copy that can diverge without affecting the original.
  fork(): Vault {
    return new Vault(Automerge.clone(this.doc));
  }

  // ---- Hosts ----

  addHost(input: AddHostInput): HostId {
    const id = newId();
    const ts = now();
    this.doc = Automerge.change(this.doc, (d) => {
      d.hosts[id] = { id, ...input, createdAt: ts, updatedAt: ts };
    });
    return id;
  }

  updateHost(id: HostId, patch: UpdateHostInput): void {
    this.doc = Automerge.change(this.doc, (d) => {
      const host = d.hosts[id];
      if (!host) return;
      Object.assign(host, patch);
      host.updatedAt = now();
    });
  }

  deleteHost(id: HostId): void {
    this.doc = Automerge.change(this.doc, (d) => {
      delete d.hosts[id];
    });
  }

  getHost(id: HostId): Host | null {
    return this.doc.hosts[id] ?? null;
  }

  listHosts(): Host[] {
    return Object.values(this.doc.hosts);
  }

  // ---- Groups ----

  addGroup(input: AddGroupInput): GroupId {
    const id = newId();
    this.doc = Automerge.change(this.doc, (d) => {
      d.groups[id] = { id, ...input };
    });
    return id;
  }

  updateGroup(id: GroupId, patch: UpdateGroupInput): void {
    this.doc = Automerge.change(this.doc, (d) => {
      const group = d.groups[id];
      if (!group) return;
      Object.assign(group, patch);
    });
  }

  deleteGroup(id: GroupId): void {
    this.doc = Automerge.change(this.doc, (d) => {
      delete d.groups[id];
    });
  }

  getGroup(id: GroupId): Group | null {
    return this.doc.groups[id] ?? null;
  }

  listGroups(): Group[] {
    return Object.values(this.doc.groups);
  }

  // ---- Identities ----

  addIdentity(input: AddIdentityInput): IdentityId {
    const id = newId();
    const ts = now();
    this.doc = Automerge.change(this.doc, (d) => {
      d.identities[id] = { id, ...input, createdAt: ts, updatedAt: ts };
    });
    return id;
  }

  updateIdentity(id: IdentityId, patch: UpdateIdentityInput): void {
    this.doc = Automerge.change(this.doc, (d) => {
      const identity = d.identities[id];
      if (!identity) return;
      Object.assign(identity, patch);
      identity.updatedAt = now();
    });
  }

  deleteIdentity(id: IdentityId): void {
    this.doc = Automerge.change(this.doc, (d) => {
      delete d.identities[id];
    });
  }

  getIdentity(id: IdentityId): Identity | null {
    return this.doc.identities[id] ?? null;
  }

  listIdentities(): Identity[] {
    return Object.values(this.doc.identities);
  }
}
