import { useEffect, useState } from 'react';
import { Terminal } from './components/Terminal';

export function App() {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    window.electronAPI.getAppVersion().then(setVersion);
  }, []);

  return (
    <div className="app">
      <Terminal />
      <footer className="status-bar">
        <span>Console</span>
        <span className="muted">v{version || '…'}</span>
      </footer>
    </div>
  );
}
