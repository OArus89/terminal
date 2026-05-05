# core

Domain logic shared across the desktop (Electron) codebase and the future mobile codebase.

Subdirectories will hold:

- `crypto/` — libsodium wrappers (`sodium-native` on desktop, `react-native-sodium` or a WASM build on mobile).
- `vault/` — CRDT-backed data model (Automerge as the initial choice).
- `storage/` — `StorageProvider` abstraction; Google Drive is the first implementation.
- `sync/` — sync protocol over `StorageProvider`.
- `ssh/` — SSH/SFTP client wrapping.

Code in this directory must avoid Electron-specific APIs so it can be reused on mobile via WASM or native bindings.
