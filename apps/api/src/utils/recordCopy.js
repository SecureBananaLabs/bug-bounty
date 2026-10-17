export function copyRecords(records) {
  return records.map((record) => structuredClone(record));
}
