export function snapshotRecords(records) {
  return records.map((record) => {
    const snapshot = {};
    for (const [key, value] of Object.entries(record)) {
      snapshot[key] = Array.isArray(value) ? [...value] : value;
    }
    return snapshot;
  });
}
