import { InMemoryStorageProvider } from '../in-memory';
import { runStorageConformance } from './conformance';

runStorageConformance('InMemory', async () => ({
  provider: new InMemoryStorageProvider(),
  cleanup: async () => {
    /* nothing to clean */
  },
}));
