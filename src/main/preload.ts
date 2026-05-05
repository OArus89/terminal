import { contextBridge, ipcRenderer } from 'electron';

// Surface only an explicit, narrow API to the renderer. Anything that touches
// keys, the vault, or Drive must go through main-process IPC handlers — never
// expose `ipcRenderer` or Node modules directly.
const electronAPI = {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),
} as const;

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
