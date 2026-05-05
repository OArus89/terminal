import { useState, type FormEvent } from 'react';
import type { AddHostInput } from '@core/vault/types';

type Props = {
  onSubmit: (input: AddHostInput) => void | Promise<void>;
  onCancel: () => void;
};

export function HostForm({ onSubmit, onCancel }: Props) {
  const [label, setLabel] = useState('');
  const [hostname, setHostname] = useState('');
  const [port, setPort] = useState('22');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await onSubmit({
        label: label.trim() || hostname.trim(),
        hostname: hostname.trim(),
        port: Number.parseInt(port, 10) || 22,
        protocol: 'ssh',
        identityId: null,
        groupId: null,
        jumpHostId: null,
        tags: [],
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="host-form" onSubmit={submit}>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label (e.g. prod-1)"
        autoFocus
      />
      <input
        value={hostname}
        onChange={(e) => setHostname(e.target.value)}
        placeholder="hostname or IP"
        required
      />
      <input
        value={port}
        onChange={(e) => setPort(e.target.value)}
        placeholder="22"
        type="number"
        min="1"
        max="65535"
        required
      />
      <div className="host-form-actions">
        <button type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" disabled={busy}>
          {busy ? '…' : 'Add'}
        </button>
      </div>
    </form>
  );
}
