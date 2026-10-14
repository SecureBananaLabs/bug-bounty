let lastTs = 0;
let seq = 0;

export function makeId(prefix) {
  const ts = Date.now();
  if (ts === lastTs) {
    seq += 1;
  } else {
    lastTs = ts;
    seq = 0;
  }
  return `${prefix}_${ts}${seq > 0 ? `_${seq}` : ""}`;
}
