const idSequences = new Map();

export function createRecordId(prefix) {
  const timestamp = Date.now();
  const previous = idSequences.get(prefix);
  const sequence = previous?.timestamp === timestamp ? previous.sequence + 1 : 0;

  idSequences.set(prefix, { timestamp, sequence });

  return sequence === 0 ? `${prefix}_${timestamp}` : `${prefix}_${timestamp}_${sequence}`;
}
