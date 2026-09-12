import assert from "node:assert/strict";
import test from "node:test";

import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

const services = [
  {
    name: "users",
    create: () => createUser({ email: "snapshot-user@example.com", role: "client" }),
    list: listUsers
  },
  {
    name: "jobs",
    create: () =>
      createJob({
        title: "Snapshot test job",
        description: "A service snapshot regression job",
        budgetMin: 100,
        budgetMax: 200,
        categoryId: "engineering",
        skills: ["node"]
      }),
    list: listJobs
  },
  {
    name: "proposals",
    create: () => createProposal({ jobId: "job_snapshot", freelancerId: "usr_snapshot", bid: 150 }),
    list: listProposals
  },
  {
    name: "reviews",
    create: () => createReview({ targetId: "usr_snapshot", rating: 5, body: "Great work" }),
    list: listReviews
  },
  {
    name: "messages",
    create: () => sendMessage({ fromUserId: "usr_a", toUserId: "usr_b", body: "Hello" }),
    list: listMessages
  },
  {
    name: "notifications",
    create: () => createNotification({ userId: "usr_snapshot", type: "proposal", title: "Update" }),
    list: listNotifications
  }
];

test("in-memory list services return defensive array snapshots", async () => {
  for (const service of services) {
    const record = await service.create();
    const before = await service.list();

    assert.ok(before.some((item) => item === record), `${service.name} includes the created record`);

    before.push({ id: `injected_${service.name}` });
    before.length = 0;

    const after = await service.list();
    assert.ok(after.some((item) => item === record), `${service.name} keeps its stored record`);
    assert.equal(
      after.some((item) => String(item.id).startsWith("injected_")),
      false,
      `${service.name} ignores caller mutations to returned arrays`
    );
  }
});
