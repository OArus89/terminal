import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'node:path';
import { PtyManager } from './pty';
import type { PtyCreateOptions } from '../shared/ipc';

// Injected by @electron-forge/plugin-vite at build time.
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
let ptyManager: PtyManager | null = null;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    void mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

const installCsp = (): void => {
  const devCsp =
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; img-src 'self' data:; " +
    "connect-src 'self' ws: http: https:; font-src 'self' data:";
  const prodCsp =
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data:; connect-src 'self' https:; font-src 'self' data:";

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [isDev ? devCsp : prodCsp],
      },
    });
  });
};

const wirePtyIpc = (): void => {
  ptyManager = new PtyManager({
    onData: (event) => mainWindow?.webContents.send('pty:data', event),
    onExit: (event) => mainWindow?.webContents.send('pty:exit', event),
  });

  ipcMain.handle('pty:create', (_event, opts: PtyCreateOptions) => {
    if (!ptyManager) throw new Error('PtyManager not initialized');
    return ptyManager.create(opts);
  });
  ipcMain.on('pty:write', (_event, sessionId: string, data: string) => {
    ptyManager?.write(sessionId, data);
  });
  ipcMain.on('pty:resize', (_event, sessionId: string, cols: number, rows: number) => {
    ptyManager?.resize(sessionId, cols, rows);
  });
  ipcMain.on('pty:kill', (_event, sessionId: string) => {
    ptyManager?.kill(sessionId);
  });
};

app.whenReady().then(() => {
  installCsp();
  wirePtyIpc();
  ipcMain.handle('app:get-version', () => app.getVersion());
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  ptyManager?.killAll();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  ptyManager?.killAll();
});

app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.on('will-navigate', (event, url) => {
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL && url.startsWith(MAIN_WINDOW_VITE_DEV_SERVER_URL)) return;
    event.preventDefault();
  });
});
