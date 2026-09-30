import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { createUser, listUsers } from "../services/userService.js";

test("list services return arrays that do not mutate the backing store", async () => {
  const job = await createJob({
    title: "Immutable List Job",
    description: "Verify list snapshots",
    budgetMin: 100,
    budgetMax: 500,
    clientId: "usr_list_owner",
    categoryId: "cat_backend",
    skills: ["node"]
  });

  const listed = await listJobs();
  listed.length = 0;

  const later = await listJobs();
  assert.ok(later.some((item) => item.id === job.id));
});

test("list services return record snapshots", async () => {
  const user = await createUser({
    email: "snapshot@example.com",
    role: "client",
    skills: ["api"]
  });

  const listed = await listUsers();
  const listedUser = listed.find((item) => item.id === user.id);
  listedUser.email = "mutated@example.com";
  listedUser.skills.push("mutated");

  const later = await listUsers();
  const laterUser = later.find((item) => item.id === user.id);

  assert.equal(laterUser.email, "snapshot@example.com");
  assert.deepEqual(laterUser.skills, ["api"]);
});
