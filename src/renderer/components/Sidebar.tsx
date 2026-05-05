import { useEffect, useState, type MouseEvent } from 'react';
import type { Host } from '@core/vault/types';
import { HostForm } from './HostForm';

type Props = {
  selectedId: string | null;
  onSelect: (host: Host | null) => void;
};

export function Sidebar({ selectedId, onSelect }: Props) {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const list = await window.electronAPI.vault.listHosts();
      if (!cancelled) setHosts(list);
    };
    void refresh();
    const unsub = window.electronAPI.vault.onChange(() => {
      void refresh();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const remove = async (e: MouseEvent, host: Host) => {
    e.stopPropagation();
    await window.electronAPI.vault.deleteHost(host.id);
    if (selectedId === host.id) onSelect(null);
  };

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <span>Hosts</span>
        <button
          type="button"
          className="add-button"
          onClick={() => setAdding((v) => !v)}
          aria-label={adding ? 'Cancel add host' : 'Add host'}
          title={adding ? 'Cancel' : 'Add host'}
        >
          {adding ? '×' : '+'}
        </button>
      </header>

      <ul className="host-list">
        {hosts.map((h) => (
          <li
            key={h.id}
            className={`host${h.id === selectedId ? ' selected' : ''}`}
            onClick={() => onSelect(h)}
          >
            <div className="host-label">{h.label}</div>
            <div className="host-meta">
              {h.hostname}:{h.port}
            </div>
            <button
              type="button"
              className="host-delete"
              onClick={(e) => void remove(e, h)}
              aria-label={`Delete ${h.label}`}
              title="Delete"
            >
              ×
            </button>
          </li>
        ))}
        {hosts.length === 0 && !adding && (
          <li className="empty">No hosts yet. Click + to add one.</li>
        )}
      </ul>

      {adding && (
        <HostForm
          onSubmit={async (input) => {
            await window.electronAPI.vault.addHost(input);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}
    </aside>
  );
}
