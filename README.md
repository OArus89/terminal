# Cross-platform console (working title)

A modern SSH/terminal client with end-to-end encrypted synchronization of user data via **Google Drive**. One account — same hosts, keys, and snippets across every device, with no dependency on a third-party cloud backend.

> The product name is not chosen yet. This document refers to it as "the app" or "the console".

---

## Target platforms

- macOS
- Windows
- Ubuntu (Linux)
- iOS
- Android

A single codebase wherever it makes sense. Platform-specific APIs only when unavoidable (biometrics, OS keychain, background tasks).

---

## Architectural principles

1. **Client-side end-to-end encryption.** Data is encrypted on the user's device **before** it leaves for Google Drive. Drive is treated as transport/storage, never as a trusted environment. Google has no access to plaintext.
2. **Storage-agnostic backend.** Google Drive is the initial implementation, but everything storage-related lives behind a `StorageProvider` abstraction. If we get paying customers, we migrate to our own server without rewriting the app — the encrypted data format does not change.
3. **CRDT-first data model.** The vault is built on a CRDT from day one. This guarantees correct merges across devices without losing edits (phone offline adds a host + laptop offline deletes a group → both changes survive sync).
4. **Local cache + offline mode.** Drive can be flaky or unreachable → the app keeps working against the local copy.
5. **Biometric vault unlock** (Touch ID / Face ID / Windows Hello / Android biometrics) layered on top of the master password.

---

## Locked-in technical decisions

### Stack: **Electron**

A single desktop codebase (Mac/Windows/Linux) on Electron. Mobile (iOS/Android) is a separate codebase (React Native or native), sharing a common **core** (CRDT model, crypto, Drive sync protocol) via WebAssembly or native bindings.

Cost of this choice: 80–150 MB bundle, 100–200 MB RAM per window, noticeable cold start. Mitigations:
- `contextIsolation: true`, `nodeIntegration: false` — mandatory hardened configuration.
- Cryptography via **`sodium-native`** (native libsodium binding), never pure-JS crypto.
- Keys and decryption live only in the **main process**; the renderer talks to it over IPC and never sees keys directly.

### Backend: **Google Drive (start) → own server (if customers appear)**

We start with no infrastructure. Once a paying audience exists and we need features Drive cannot support (multiplayer, team vaults, audit logs, server-controlled versioning), we migrate to our own backend. End-to-end encryption protects data through the transition: blob format stays the same, only the transport changes.

### Sync model: **CRDT**

CRDT goes in from day one — not deferred. Initial candidate: **Automerge** (document-oriented, maps cleanly onto our vault structure of hosts/groups/identities as objects and arrays). Fallback: Yjs / yrs if Automerge becomes a performance bottleneck.

Mapping operations to CRDT primitives:

| Operation | CRDT type |
|---|---|
| Add / remove host | OR-Set |
| Rename host, change port | LWW-Register per field |
| Group tree | Move-friendly tree CRDT (Automerge `Tree` or hand-rolled) |
| Counters (e.g. connection stats) | G-Counter |

In Drive, each device writes its own append-only operations log under an encrypted file name. On sync, the app downloads all logs, merges the CRDT state locally, and **never overwrites** other devices' files. Periodic compaction folds logs into snapshots.

---

## Scope

### Must-have (MVP)

- Terminal on all 5 platforms.
- **SSH** + **SFTP**.
- CRDT-backed data model: **Hosts**, **Groups** (with inherited settings), **Identities** (login + key), **Keychain** for centralized key/password storage.
- **Known hosts**.
- **Port forwarding** (local / remote).
- **Jump hosts**.
- E2E encryption of local storage and of files in Google Drive.
- Biometric vault unlock.
- Local cache and offline mode.
- `StorageProvider` abstraction: Drive is the first implementation, replacement path is wired in from day one.

### Nice-to-have (second iteration)

- **Snippets** — saved commands/scripts, runnable from the terminal.
- **Autocomplete** from snippets, history, paths.
- **Session logs** with search and bookmarks.
- **Workspaces / split panes** — multiple sessions in one window.
- **Tags** layered on top of groups.
- **Command broadcasting** — one command into N sessions at once.
- **FIDO2 / hardware keys**.
- AI-assisted command generation from natural language (optional, user-supplied API key).

### Deliberately out of scope (for now)

- **Multiplayer / real-time co-sessions** — needs a relay server; revisited after own-backend migration.
- **Team vaults and cross-user sharing** — single-user product for now; revisited together with the own backend.
- **AI agent** in the spirit of Termius Gloria — a separate large project.
- **SAML SSO, SOC 2, enterprise features** — not relevant for MVP.
- **Mosh, Telnet, Serial** — not a priority yet.
- **Post-quantum signatures (ML-DSA)** — premature.

---

## Open questions

### Encryption scheme (recommendation pending confirmation)

Hybrid scheme (same family as Termius / 1Password / Bitwarden):

```
master password → Argon2id → KEK (key-encryption key)
keypair (X25519): private encrypted with KEK, public is open
DEK (data key) — random, encrypted with the public key
DEK symmetrically encrypts the vault (XChaCha20-Poly1305)
```

| Layer | Algorithm |
|---|---|
| KDF | **Argon2id**, memory ≥ 256 MB, t=3, p=1 |
| Symmetric | **XChaCha20-Poly1305** (libsodium `crypto_secretbox`) |
| Asymmetric | **X25519** + `crypto_box` (libsodium) |
| Hash | **BLAKE2b** |

Advantage over symmetric-only: changing the password re-encrypts only the private key (~32 bytes), not the entire vault. The DEK can be rotated independently of the password.

### Drive-specific hardening

1. **Anti-rollback.** Every blob carries a monotonic `vault_version`; the local copy of the counter lives in OS secure storage. If Drive returns a version lower than the last known one → never accept silently.
2. **AEAD over the entire file, including the header.** No plaintext fields anywhere.
3. **No metadata leakage.** File names in Drive are hashes (BLAKE2b of the vault id), no user-friendly strings.
4. **AAD = vault_id + version + chunk_index** — an attacker cannot swap one valid blob for another.
5. **Google OAuth token** lives in OS secure storage, never in a plain app file.
6. **Local KEK cache** sits behind biometrics with a configurable TTL; the master password is never cached.

### CRDT × encryption

Open design question: encrypt the CRDT as a whole snapshot, or encrypt each operation individually (op-level encryption). MVP will likely combine both: ops are encrypted one by one (cheap append into Drive), with periodic encrypted snapshots replacing logs on compaction.

---

## Inspiration / prior art

Functional and UX prototyping draws on **Termius** ([termius.com](https://termius.com)) — its data model (hosts/groups/identities/keychain/vaults), snippets and logs organization, and hybrid E2E encryption via libsodium. Key differences in our approach: Google Drive instead of an own backend (at the start), and a CRDT-first store for correct merges across devices.
