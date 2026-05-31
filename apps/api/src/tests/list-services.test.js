import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

const listServices = [
  {
    name: "jobs",
    create: () => createJob({ title: "Snapshot job" }),
    list: listJobs,
    injected: { id: "job_injected", title: "Injected job" },
  },
  {
    name: "messages",
    create: () => sendMessage({ body: "Snapshot message" }),
    list: listMessages,
    injected: { id: "msg_injected", body: "Injected message" },
  },
  {
    name: "notifications",
    create: () => createNotification({ message: "Snapshot notification" }),
    list: listNotifications,
    injected: { id: "ntf_injected", message: "Injected notification" },
  },
  {
    name: "proposals",
    create: () => createProposal({ summary: "Snapshot proposal" }),
    list: listProposals,
    injected: { id: "prp_injected", summary: "Injected proposal" },
  },
  {
    name: "reviews",
    create: () => createReview({ rating: 5 }),
    list: listReviews,
    injected: { id: "rev_injected", rating: 1 },
  },
  {
    name: "users",
    create: () => createUser({ name: "Snapshot user" }),
    list: listUsers,
    injected: { id: "usr_injected", name: "Injected user" },
  },
];

for (const service of listServices) {
  test(`${service.name} list returns a snapshot of stored records`, async () => {
    const created = await service.create();
    const listed = await service.list();

    listed.push(service.injected);
    listed.length = 0;

    const listedAgain = await service.list();

    assert.ok(listedAgain.some((record) => record.id === created.id));
    assert.equal(
      listedAgain.some((record) => record.id === service.injected.id),
      false,
    );
  });
}
