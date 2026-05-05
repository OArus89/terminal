import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { LocalFsStorageProvider } from '../local-fs';
import { runStorageConformance } from '../../../core/storage/__tests__/conformance';

runStorageConformance('LocalFs', async () => {
  const dir = path.join(tmpdir(), `console-localfs-${Date.now()}-${globalThis.crypto.randomUUID()}`);
  return {
    provider: new LocalFsStorageProvider(dir),
    cleanup: async () => {
      await fs.rm(dir, { recursive: true, force: true });
    },
  };
});
