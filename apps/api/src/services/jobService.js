import { getDb } from "../config/prisma.js";
import { ensureCategory, ensureUser, mapJob, nextId } from "./persistenceHelpers.js";

export async function listJobs() {
  const db = getDb();
  const jobs = await db.job.findMany({
    orderBy: { createdAt: "asc" }
  });

  return jobs.map(mapJob);
}

export async function createJob(payload) {
  const db = getDb();
  const id = nextId("job", payload.id);
  const clientId = payload.clientId ?? "usr_system_client";
  const categoryId = payload.categoryId ?? "cat_general";

  await ensureUser(clientId);
  await ensureCategory(categoryId);

  const job = await db.job.create({
    data: {
      id,
      title: payload.title,
      description: payload.description,
      budgetMin: payload.budgetMin,
      budgetMax: payload.budgetMax,
      status: "OPEN",
      clientId,
      categoryId
    }
  });

  return mapJob(job);
}
