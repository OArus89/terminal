import { useEffect, useRef } from 'react';
import { Terminal as XTerm, type ITheme } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

const theme: ITheme = {
  background: '#0d1117',
  foreground: '#e6edf3',
  cursor: '#e6edf3',
  cursorAccent: '#0d1117',
  selectionBackground: '#264f78',
  black: '#484f58',
  red: '#ff7b72',
  green: '#7ee787',
  yellow: '#d29922',
  blue: '#79c0ff',
  magenta: '#d2a8ff',
  cyan: '#a5d6ff',
  white: '#b1bac4',
  brightBlack: '#6e7681',
  brightRed: '#ffa198',
  brightGreen: '#56d364',
  brightYellow: '#e3b341',
  brightBlue: '#79c0ff',
  brightMagenta: '#d2a8ff',
  brightCyan: '#a5d6ff',
  brightWhite: '#f0f6fc',
};

export function Terminal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new XTerm({
      theme,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Mono", monospace',
      fontSize: 13,
      cursorBlink: true,
      allowProposedApi: true,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(container);
    fitAddon.fit();

    let sessionId: string | null = null;
    let unsubData: (() => void) | null = null;
    let unsubExit: (() => void) | null = null;

    void (async () => {
      sessionId = await window.electronAPI.pty.create({
        cols: term.cols,
        rows: term.rows,
      });

      unsubData = window.electronAPI.pty.onData(({ sessionId: id, data }) => {
        if (id === sessionId) term.write(data);
      });

      unsubExit = window.electronAPI.pty.onExit(({ sessionId: id, exitCode }) => {
        if (id === sessionId) {
          term.write(`\r\n\x1b[31m[process exited with code ${exitCode}]\x1b[0m\r\n`);
        }
      });

      term.onData((data) => {
        if (sessionId) window.electronAPI.pty.write(sessionId, data);
      });

      term.onResize(({ cols, rows }) => {
        if (sessionId) window.electronAPI.pty.resize(sessionId, cols, rows);
      });
    })();

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);
    const observer = new ResizeObserver(() => fitAddon.fit());
    observer.observe(container);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      unsubData?.();
      unsubExit?.();
      if (sessionId) window.electronAPI.pty.kill(sessionId);
      term.dispose();
    };
  }, []);

  return <div ref={containerRef} className="terminal-container" />;
}
