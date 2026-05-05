import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type {
  PtyCreateOptions,
  PtyDataEvent,
  PtyExitEvent,
  Host,
  HostId,
  AddHostInput,
} from '../shared/ipc';

// Surface only an explicit, narrow API to the renderer. Anything that touches
// keys, the vault, or Drive must go through main-process IPC handlers — never
// expose `ipcRenderer` or Node modules directly.
const electronAPI = {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),

  pty: {
    create: (opts: PtyCreateOptions): Promise<string> => ipcRenderer.invoke('pty:create', opts),
    write: (sessionId: string, data: string): void => {
      ipcRenderer.send('pty:write', sessionId, data);
    },
    resize: (sessionId: string, cols: number, rows: number): void => {
      ipcRenderer.send('pty:resize', sessionId, cols, rows);
    },
    kill: (sessionId: string): void => {
      ipcRenderer.send('pty:kill', sessionId);
    },
    onData: (listener: (event: PtyDataEvent) => void): (() => void) => {
      const wrapped = (_event: IpcRendererEvent, payload: PtyDataEvent) => listener(payload);
      ipcRenderer.on('pty:data', wrapped);
      return () => {
        ipcRenderer.removeListener('pty:data', wrapped);
      };
    },
    onExit: (listener: (event: PtyExitEvent) => void): (() => void) => {
      const wrapped = (_event: IpcRendererEvent, payload: PtyExitEvent) => listener(payload);
      ipcRenderer.on('pty:exit', wrapped);
      return () => {
        ipcRenderer.removeListener('pty:exit', wrapped);
      };
    },
  },

  vault: {
    listHosts: (): Promise<Host[]> => ipcRenderer.invoke('vault:list-hosts'),
    addHost: (input: AddHostInput): Promise<HostId> => ipcRenderer.invoke('vault:add-host', input),
    deleteHost: (id: HostId): Promise<void> => ipcRenderer.invoke('vault:delete-host', id),
    onChange: (listener: () => void): (() => void) => {
      const wrapped = () => listener();
      ipcRenderer.on('vault:changed', wrapped);
      return () => {
        ipcRenderer.removeListener('vault:changed', wrapped);
      };
    },
  },
} as const;

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
