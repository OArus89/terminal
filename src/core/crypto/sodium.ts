import sodium from 'libsodium-wrappers-sumo';

let ready = false;

// libsodium needs an async init (WASM compile). Cache the awaited handle so
// every call after the first is a no-op.
export const getSodium = async (): Promise<typeof sodium> => {
  if (!ready) {
    await sodium.ready;
    ready = true;
  }
  return sodium;
};
