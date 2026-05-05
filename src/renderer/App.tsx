import { useEffect, useState } from 'react';

export function App() {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    window.electronAPI.getAppVersion().then(setVersion);
  }, []);

  return (
    <main className="app">
      <h1>Console</h1>
      <p className="muted">
        Skeleton ready. App version: <code>{version || 'loading…'}</code>
      </p>
    </main>
  );
}
