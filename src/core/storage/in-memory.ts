import type { StorageProvider, BlobId, BlobMetadata } from './types';

// Defensive copies on put/get keep callers from mutating storage internals
// (which would otherwise be a hard-to-trace source of bugs).

export class InMemoryStorageProvider implements StorageProvider {
  private readonly blobs = new Map<BlobId, { data: Uint8Array; modifiedAt: number }>();

  async put(id: BlobId, data: Uint8Array): Promise<void> {
    this.blobs.set(id, { data: new Uint8Array(data), modifiedAt: Date.now() });
  }

  async get(id: BlobId): Promise<Uint8Array | null> {
    const entry = this.blobs.get(id);
    return entry ? new Uint8Array(entry.data) : null;
  }

  async delete(id: BlobId): Promise<void> {
    this.blobs.delete(id);
  }

  async list(): Promise<BlobMetadata[]> {
    return Array.from(this.blobs.entries()).map(([id, { data, modifiedAt }]) => ({
      id,
      size: data.length,
      modifiedAt,
    }));
  }

  async exists(id: BlobId): Promise<boolean> {
    return this.blobs.has(id);
  }
}
