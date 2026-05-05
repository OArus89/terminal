// Vault entity shapes. These travel through Automerge so:
//  - we use `null` for absent FKs (not `undefined`), since Automerge does not
//    distinguish missing-key from undefined-value cleanly;
//  - all values are plain JSON-compatible (no class instances, no Date — we
//    store epoch-millis numbers).

export type HostId = string;
export type GroupId = string;
export type IdentityId = string;

export type Protocol = 'ssh' | 'sftp';
export type AuthMethod = 'password' | 'key' | 'agent';

export type Host = {
  id: HostId;
  label: string;
  hostname: string;
  port: number;
  protocol: Protocol;
  identityId: IdentityId | null;
  groupId: GroupId | null;
  jumpHostId: HostId | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
};

export type Group = {
  id: GroupId;
  name: string;
  parentGroupId: GroupId | null;
  defaultIdentityId: IdentityId | null;
  defaultPort: number | null;
};

export type Identity = {
  id: IdentityId;
  label: string;
  username: string;
  authMethod: AuthMethod;
  // FK to a future keychain entry holding the actual key material. Left as
  // string-or-null for now; the keychain module will land later.
  keychainEntryId: string | null;
  createdAt: number;
  updatedAt: number;
};

export type VaultDoc = {
  hosts: { [id: HostId]: Host };
  groups: { [id: GroupId]: Group };
  identities: { [id: IdentityId]: Identity };
};

export type AddHostInput = Omit<Host, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateHostInput = Partial<Omit<Host, 'id' | 'createdAt' | 'updatedAt'>>;

export type AddGroupInput = Omit<Group, 'id'>;
export type UpdateGroupInput = Partial<Omit<Group, 'id'>>;

export type AddIdentityInput = Omit<Identity, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateIdentityInput = Partial<Omit<Identity, 'id' | 'createdAt' | 'updatedAt'>>;
