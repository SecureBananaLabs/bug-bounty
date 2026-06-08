const publicIdState = new Map();

export function createPublicId(prefix) {
  const timestamp = Date.now();
  const state = publicIdState.get(prefix);

  if (!state || state.timestamp !== timestamp) {
    publicIdState.set(prefix, { timestamp, sequence: 0 });
    return `${prefix}_${timestamp}`;
  }

  const sequence = state.sequence + 1;
  publicIdState.set(prefix, { timestamp, sequence });
  return `${prefix}_${timestamp}_${sequence}`;
}

export function resetPublicIdState() {
  publicIdState.clear();
}
