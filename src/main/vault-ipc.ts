import { ipcMain, BrowserWindow } from 'electron';
import { Vault } from '../core/vault';
import type { AddHostInput, HostId } from '../core/vault/types';

// Single in-memory vault for the running app. Persistence and encryption
// are wired in a later step — at that point this will load from
// StorageProvider on startup and save on every change.

let vault: Vault | null = null;

const broadcast = (channel: string): void => {
  for (const w of BrowserWindow.getAllWindows()) {
    w.webContents.send(channel);
  }
};

export const initVaultIpc = (): void => {
  vault = Vault.create();

  ipcMain.handle('vault:list-hosts', () => {
    if (!vault) throw new Error('Vault not initialized');
    return vault.listHosts();
  });

  ipcMain.handle('vault:add-host', (_event, input: AddHostInput): HostId => {
    if (!vault) throw new Error('Vault not initialized');
    const id = vault.addHost(input);
    broadcast('vault:changed');
    return id;
  });

  ipcMain.handle('vault:delete-host', (_event, id: HostId) => {
    if (!vault) throw new Error('Vault not initialized');
    vault.deleteHost(id);
    broadcast('vault:changed');
  });
};
