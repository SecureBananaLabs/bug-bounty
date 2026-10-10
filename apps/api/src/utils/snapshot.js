function snapshotValue(value) {
  if (Array.isArray(value)) {
    return value.map(snapshotValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, snapshotValue(nestedValue)])
    );
  }

  return value;
}

export function snapshotRecord(record) {
  return snapshotValue(record);
}

export function snapshotRecords(records) {
  return records.map(snapshotRecord);
}
