import { randomUUID } from "crypto";
export function createJob(data: any) {
  return { ...data, id: randomUUID(), status: "OPEN" };
}
