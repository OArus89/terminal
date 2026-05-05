import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { StorageProvider, BlobId, BlobMetadata } from '../../core/storage';

const isEnoent = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as NodeJS.ErrnoException).code === 'ENOENT';

// Desktop-side StorageProvider backed by a single directory. One blob per file.
// Lives under src/main/ rather than src/core/ because it depends on node:fs.

export class LocalFsStorageProvider implements StorageProvider {
  constructor(private readonly rootDir: string) {}

  private pathFor(id: BlobId): string {
    return path.join(this.rootDir, id);
  }

  async put(id: BlobId, data: Uint8Array): Promise<void> {
    await fs.mkdir(this.rootDir, { recursive: true });
    await fs.writeFile(this.pathFor(id), data);
  }

  async get(id: BlobId): Promise<Uint8Array | null> {
    try {
      const buf = await fs.readFile(this.pathFor(id));
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    } catch (err) {
      if (isEnoent(err)) return null;
      throw err;
    }
  }

  async delete(id: BlobId): Promise<void> {
    try {
      await fs.unlink(this.pathFor(id));
    } catch (err) {
      if (isEnoent(err)) return;
      throw err;
    }
  }

  async list(): Promise<BlobMetadata[]> {
    let entries: string[];
    try {
      entries = await fs.readdir(this.rootDir);
    } catch (err) {
      if (isEnoent(err)) return [];
      throw err;
    }

    return Promise.all(
      entries.map(async (name) => {
        const stat = await fs.stat(path.join(this.rootDir, name));
        return { id: name, size: stat.size, modifiedAt: stat.mtimeMs };
      }),
    );
  }

  async exists(id: BlobId): Promise<boolean> {
    try {
      await fs.access(this.pathFor(id));
      return true;
    } catch {
      return false;
    }
  }
}
