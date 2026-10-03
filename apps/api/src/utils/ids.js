const lastSequences = new Map();

export function createId(prefix) {
  const now = Date.now();
  const previous = lastSequences.get(prefix);
  const sequence = previous?.timestamp === now ? previous.sequence + 1 : 0;
  lastSequences.set(prefix, { timestamp: now, sequence });

  return sequence === 0 ? `${prefix}_${now}` : `${prefix}_${now}_${sequence}`;
}
