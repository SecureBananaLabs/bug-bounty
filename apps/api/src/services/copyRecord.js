export function copyRecord(record) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value] : value
    ])
  );
}

export function copyRecords(records) {
  return records.map(copyRecord);
}
