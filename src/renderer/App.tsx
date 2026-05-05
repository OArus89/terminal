import { useEffect, useState } from 'react';
import { Terminal } from './components/Terminal';
import { Sidebar } from './components/Sidebar';
import type { Host } from '@core/vault/types';

export function App() {
  const [version, setVersion] = useState<string>('');
  const [selected, setSelected] = useState<Host | null>(null);

  useEffect(() => {
    window.electronAPI.getAppVersion().then(setVersion);
  }, []);

  return (
    <div className="app">
      <Sidebar selectedId={selected?.id ?? null} onSelect={setSelected} />
      <main className="main">
        <header className="terminal-header">
          {selected ? (
            <span>
              <strong>{selected.label}</strong>{' '}
              <span className="muted">
                ({selected.hostname}:{selected.port}) · SSH coming soon — local shell active
              </span>
            </span>
          ) : (
            <span className="muted">Local shell</span>
          )}
        </header>
        <Terminal />
      </main>
      <footer className="status-bar">
        <span>Console</span>
        <span className="muted">v{version || '…'}</span>
      </footer>
    </div>
  );
}
