export function snapshotRecord(record) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value] : value
    ])
  );
}

export function snapshotList(records) {
  return records.map(snapshotRecord);
}
