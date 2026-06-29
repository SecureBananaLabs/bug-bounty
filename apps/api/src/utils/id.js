const sequences = new Map();

export function createId(prefix) {
  const timestamp = Date.now();
  const current = sequences.get(prefix);
  const sequence = current?.timestamp === timestamp ? current.sequence + 1 : 0;

  sequences.set(prefix, { timestamp, sequence });

  return sequence === 0 ? `${prefix}_${timestamp}` : `${prefix}_${timestamp}_${sequence}`;
}

export function resetIdSequencesForTests() {
  sequences.clear();
}
