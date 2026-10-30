export function cloneRecord(value) {
  if (Array.isArray(value)) {
    return value.map(cloneRecord);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, cloneRecord(nested)])
    );
  }

  return value;
}

export function cloneRecords(records) {
  return records.map(cloneRecord);
}
