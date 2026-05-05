import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { StorageProvider } from '../types';

// Shared conformance suite. Any StorageProvider implementation can be plugged
// in via a setup function that returns the provider plus a cleanup hook.

export type Setup = () => Promise<{
  provider: StorageProvider;
  cleanup: () => Promise<void>;
}>;

export const runStorageConformance = (name: string, setup: Setup): void => {
  describe(`StorageProvider conformance — ${name}`, () => {
    let provider: StorageProvider;
    let cleanup: () => Promise<void>;

    beforeEach(async () => {
      const ctx = await setup();
      provider = ctx.provider;
      cleanup = ctx.cleanup;
    });

    afterEach(async () => {
      await cleanup();
    });

    it('get returns null for a missing blob', async () => {
      expect(await provider.get('missing')).toBeNull();
    });

    it('exists is false for a missing blob', async () => {
      expect(await provider.exists('missing')).toBe(false);
    });

    it('put then get round-trips the bytes', async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      await provider.put('alpha', data);
      expect(await provider.get('alpha')).toEqual(data);
    });

    it('put overwrites an existing blob', async () => {
      await provider.put('x', new Uint8Array([1]));
      await provider.put('x', new Uint8Array([2, 3]));
      expect(await provider.get('x')).toEqual(new Uint8Array([2, 3]));
    });

    it('exists flips to true after put', async () => {
      expect(await provider.exists('y')).toBe(false);
      await provider.put('y', new Uint8Array([0]));
      expect(await provider.exists('y')).toBe(true);
    });

    it('delete removes the blob', async () => {
      await provider.put('z', new Uint8Array([1]));
      await provider.delete('z');
      expect(await provider.get('z')).toBeNull();
      expect(await provider.exists('z')).toBe(false);
    });

    it('delete is idempotent for a missing blob', async () => {
      await expect(provider.delete('never-existed')).resolves.toBeUndefined();
    });

    it('list returns metadata for every stored blob', async () => {
      await provider.put('a', new Uint8Array([1]));
      await provider.put('b', new Uint8Array([1, 2, 3]));
      const blobs = await provider.list();
      const byId = Object.fromEntries(blobs.map((b) => [b.id, b]));
      expect(Object.keys(byId).sort()).toEqual(['a', 'b']);
      expect(byId['a']?.size).toBe(1);
      expect(byId['b']?.size).toBe(3);
      expect(byId['a']?.modifiedAt).toBeGreaterThan(0);
    });

    it('list returns an empty array when nothing is stored', async () => {
      expect(await provider.list()).toEqual([]);
    });

    it('mutating bytes after put does not poison storage', async () => {
      const data = new Uint8Array([1, 2, 3]);
      await provider.put('immut', data);
      data[0] = 99;
      const stored = await provider.get('immut');
      expect(stored?.[0]).toBe(1);
    });
  });
};
