let lastTimestamp = 0;
let sameTimestampSequence = 0;

export function createRecordId(prefix) {
  const timestamp = Date.now();

  if (timestamp === lastTimestamp) {
    sameTimestampSequence += 1;
  } else {
    lastTimestamp = timestamp;
    sameTimestampSequence = 0;
  }

  const suffix = sameTimestampSequence === 0 ? "" : `_${sameTimestampSequence}`;
  return `${prefix}_${timestamp}${suffix}`;
}
