import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { spawn, type IPty } from 'node-pty';
import type { PtyCreateOptions, PtyDataEvent, PtyExitEvent } from '../shared/ipc';

type Listeners = {
  onData: (event: PtyDataEvent) => void;
  onExit: (event: PtyExitEvent) => void;
};

const defaultShell = (): string => {
  if (process.platform === 'win32') {
    return process.env.COMSPEC ?? 'cmd.exe';
  }
  return process.env.SHELL ?? '/bin/bash';
};

export class PtyManager {
  private readonly sessions = new Map<string, IPty>();

  constructor(private readonly listeners: Listeners) {}

  create(opts: PtyCreateOptions): string {
    const sessionId = randomUUID();
    const ptyProcess = spawn(defaultShell(), [], {
      name: 'xterm-256color',
      cols: opts.cols,
      rows: opts.rows,
      cwd: os.homedir(),
      env: process.env as Record<string, string>,
    });

    ptyProcess.onData((data) => {
      this.listeners.onData({ sessionId, data });
    });

    ptyProcess.onExit(({ exitCode }) => {
      this.sessions.delete(sessionId);
      this.listeners.onExit({ sessionId, exitCode });
    });

    this.sessions.set(sessionId, ptyProcess);
    return sessionId;
  }

  write(sessionId: string, data: string): void {
    this.sessions.get(sessionId)?.write(data);
  }

  resize(sessionId: string, cols: number, rows: number): void {
    this.sessions.get(sessionId)?.resize(cols, rows);
  }

  kill(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.kill();
    this.sessions.delete(sessionId);
  }

  killAll(): void {
    for (const session of this.sessions.values()) {
      session.kill();
    }
    this.sessions.clear();
  }
}
