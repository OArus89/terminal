# core

Domain logic shared across the desktop (Electron) codebase and the future mobile codebase.

Subdirectories:

- `crypto/` — libsodium wrappers (`libsodium-wrappers-sumo`, the WASM build that includes Argon2id). Implements the hybrid scheme: KDF (Argon2id) → KEK → encrypts an X25519 secret key; random per-vault DEK is sealed to the public key; vault payload is AEAD-encrypted with the DEK, bound to AAD.
- `vault/` — CRDT-backed data model (Automerge as the initial choice).
- `storage/` — `StorageProvider` abstraction; Google Drive is the first implementation.
- `sync/` — sync protocol over `StorageProvider`.
- `ssh/` — SSH/SFTP client wrapping.

Code in this directory must avoid Electron-specific APIs so it can be reused on mobile via WASM or native bindings. The crypto module uses a WASM libsodium build for the same reason — it runs unchanged in Node, the browser, and React Native.
