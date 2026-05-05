import type { Host, HostId, AddHostInput } from '../core/vault/types';

// PTY contract.
export type PtyCreateOptions = {
  cols: number;
  rows: number;
};

export type PtyDataEvent = {
  sessionId: string;
  data: string;
};

export type PtyExitEvent = {
  sessionId: string;
  exitCode: number;
};

// Vault contract. Only the renderer-facing slice — write paths take the
// vault's native AddHostInput shape so we don't drift from the core model.
export type { Host, HostId, AddHostInput };
