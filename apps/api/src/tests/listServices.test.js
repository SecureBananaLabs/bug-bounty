import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

const services = [
  {
    name: "jobs",
    create: createJob,
    list: listJobs,
    payload: { title: "Original job", skills: ["node"] },
    mutateField: "title"
  },
  {
    name: "proposals",
    create: createProposal,
    list: listProposals,
    payload: { coverLetter: "Original proposal", tags: ["api"] },
    mutateField: "coverLetter"
  },
  {
    name: "reviews",
    create: createReview,
    list: listReviews,
    payload: { body: "Original review", tags: ["quality"] },
    mutateField: "body"
  },
  {
    name: "messages",
    create: sendMessage,
    list: listMessages,
    payload: { body: "Original message", tags: ["inbox"] },
    mutateField: "body"
  },
  {
    name: "notifications",
    create: createNotification,
    list: listNotifications,
    payload: { title: "Original notification", tags: ["system"] },
    mutateField: "title"
  },
  {
    name: "users",
    create: createUser,
    list: listUsers,
    payload: { name: "Original user", tags: ["client"] },
    mutateField: "name"
  }
];

for (const service of services) {
  test(`${service.name} list returns defensive snapshots`, async () => {
    const created = await service.create(service.payload);
    const firstList = await service.list();
    const listed = firstList.find((record) => record.id === created.id);
    const arrayField = Object.keys(service.payload).find((key) => Array.isArray(service.payload[key]));

    assert.ok(listed);

    firstList.push({ id: "injected-record" });
    listed[service.mutateField] = "mutated";
    listed[arrayField].push("mutated");

    const secondList = await service.list();
    const later = secondList.find((record) => record.id === created.id);

    assert.equal(secondList.some((record) => record.id === "injected-record"), false);
    assert.equal(later[service.mutateField], service.payload[service.mutateField]);
    assert.deepEqual(later[arrayField], service.payload[arrayField]);
  });
}
