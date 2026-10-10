import { randomUUID } from "node:crypto";

export function createPrefixedId(prefix) {
  return `${prefix}_${randomUUID()}`;
}
