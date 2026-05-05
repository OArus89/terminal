# core

Domain logic shared across the desktop (Electron) codebase and the future mobile codebase.

Subdirectories:

- `crypto/` — libsodium wrappers (`libsodium-wrappers-sumo`, the WASM build that includes Argon2id). Implements the hybrid scheme: KDF (Argon2id) → KEK → encrypts an X25519 secret key; random per-vault DEK is sealed to the public key; vault payload is AEAD-encrypted with the DEK, bound to AAD.
- `vault/` — CRDT-backed data model (Automerge). Hosts, Groups, Identities; encrypted persistence wires the vault into `crypto/`.
- `storage/` — `StorageProvider` interface + an in-memory implementation. Real backends (LocalFs for desktop, Google Drive next) live in their respective platform directories (`src/main/storage/` for desktop) so this module stays platform-neutral. A shared conformance test suite lives in `storage/__tests__/conformance.ts` and is invoked from each implementation's test file.
- `sync/` — sync protocol over `StorageProvider` (not yet implemented).
- `ssh/` — SSH/SFTP client wrapping (not yet implemented).

Code in this directory must avoid Electron-specific or Node-specific APIs so it can be reused on mobile via WASM or native bindings.
