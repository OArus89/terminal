// Backend-agnostic blob store. The vault layer encodes its CRDT snapshots and
// op-logs into Uint8Array blobs; the storage layer just shuttles those bytes
// to/from a backend (local FS today, Google Drive tomorrow, own server later).
//
// BlobId is opaque to the provider — the caller decides the naming scheme
// (e.g. BLAKE2b hash of the vault id, so file names in the backend leak no
// metadata).

export type BlobId = string;

export type BlobMetadata = {
  id: BlobId;
  size: number;
  modifiedAt: number;
};

export interface StorageProvider {
  // Replace-or-create. Idempotent.
  put(id: BlobId, data: Uint8Array): Promise<void>;

  // Returns null when the blob does not exist.
  get(id: BlobId): Promise<Uint8Array | null>;

  // Idempotent — deleting a missing blob is not an error.
  delete(id: BlobId): Promise<void>;

  list(): Promise<BlobMetadata[]>;

  exists(id: BlobId): Promise<boolean>;
}
