export function snapshotRecords(records) {
  return records.map((record) => {
    const snapshot = { ...record };

    for (const [key, value] of Object.entries(snapshot)) {
      if (Array.isArray(value)) {
        snapshot[key] = [...value];
      }
    }

    return snapshot;
  });
}
