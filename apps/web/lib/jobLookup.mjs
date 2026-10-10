export function findJobById(jobs, id) {
  const key = String(id ?? "").trim();
  if (!key) {
    return undefined;
  }
  return jobs.find((job) => job.id === key);
}
