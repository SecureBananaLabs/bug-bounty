function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneValue);
  }

  if (value && typeof value === "object") {
    return snapshotRecord(value);
  }

  return value;
}

export function snapshotRecord(record) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, cloneValue(value)])
  );
}

export function snapshotList(records) {
  return records.map(snapshotRecord);
}
