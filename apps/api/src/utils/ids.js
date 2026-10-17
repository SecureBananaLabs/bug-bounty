import { randomUUID } from "node:crypto";

export function createEntityId(prefix) {
  return `${prefix}_${randomUUID()}`;
}
