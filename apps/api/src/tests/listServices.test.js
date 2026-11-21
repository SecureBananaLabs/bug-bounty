import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

const cases = [
  {
    name: "jobs",
    create: () => createJob({ title: "Defensive copy job" }),
    list: listJobs
  },
  {
    name: "messages",
    create: () => sendMessage({ body: "Defensive copy message" }),
    list: listMessages
  },
  {
    name: "notifications",
    create: () => createNotification({ body: "Defensive copy notification" }),
    list: listNotifications
  },
  {
    name: "proposals",
    create: () => createProposal({ coverLetter: "Defensive copy proposal" }),
    list: listProposals
  },
  {
    name: "reviews",
    create: () => createReview({ rating: 5, body: "Defensive copy review" }),
    list: listReviews
  },
  {
    name: "users",
    create: () => createUser({ name: "Defensive Copy User" }),
    list: listUsers
  }
];

for (const serviceCase of cases) {
  test(`${serviceCase.name} list returns defensive record copies`, async () => {
    const before = await serviceCase.list();
    const created = await serviceCase.create();
    const snapshot = await serviceCase.list();

    assert.equal(snapshot.length, before.length + 1);

    snapshot.push({ id: "external_record" });
    snapshot[snapshot.length - 2].id = "external_mutation";

    const after = await serviceCase.list();
    assert.equal(after.length, before.length + 1);
    assert.equal(after.at(-1).id, created.id);
  });
}
