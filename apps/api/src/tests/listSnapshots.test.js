import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { createUser, listUsers } from "../services/userService.js";

test("listJobs returns an array snapshot with copied record fields", async () => {
  const created = await createJob({
    title: "Snapshot safety",
    tags: ["api", "safety"]
  });
  const listed = await listJobs();
  const listedJob = listed.find((job) => job.id === created.id);

  listed.push({ id: "injected-job", title: "Injected" });
  listedJob.title = "Mutated title";
  listedJob.tags.push("mutated");

  const later = await listJobs();
  const storedJob = later.find((job) => job.id === created.id);

  assert.equal(later.some((job) => job.id === "injected-job"), false);
  assert.equal(storedJob.title, "Snapshot safety");
  assert.deepEqual(storedJob.tags, ["api", "safety"]);
});

test("listUsers returns copied records and array-valued fields", async () => {
  const created = await createUser({
    email: "snapshot@example.com",
    roles: ["client"]
  });
  const listed = await listUsers();
  const listedUser = listed.find((user) => user.id === created.id);

  listedUser.email = "mutated@example.com";
  listedUser.roles.push("admin");

  const later = await listUsers();
  const storedUser = later.find((user) => user.id === created.id);

  assert.equal(storedUser.email, "snapshot@example.com");
  assert.deepEqual(storedUser.roles, ["client"]);
});
