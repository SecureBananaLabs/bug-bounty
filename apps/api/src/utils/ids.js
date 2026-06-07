import { randomUUID } from "node:crypto";

export function createServiceId(prefix) {
  return `${prefix}_${randomUUID()}`;
}
