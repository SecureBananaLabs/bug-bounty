import test from "node:test";
import assert from "node:assert/strict";
import { listUsers, createUser } from "../services/userService.js";
import { listJobs, createJob } from "../services/jobService.js";
import { listProposals, createProposal } from "../services/proposalService.js";
import { listReviews, createReview } from "../services/reviewService.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { listNotifications, createNotification } from "../services/notificationService.js";

const cases = [
  {
    name: "users",
    create: () => createUser({ email: "a@example.com" }),
    list: listUsers,
    mutate: (items) => items.push({ id: "evil" }),
    expect: (items) => assert.equal(items.length, 1)
  },
  {
    name: "jobs",
    create: () => createJob({ title: "Build thing", description: "A detailed job post", budgetMin: 10, budgetMax: 20, categoryId: "cat_1", skills: [] }),
    list: listJobs,
    mutate: (items) => items.splice(0, items.length),
    expect: (items) => assert.equal(items.length, 1)
  },
  {
    name: "proposals",
    create: () => createProposal({ jobId: "job_1", freelancerId: "usr_1", coverLetter: "I can do this" }),
    list: listProposals,
    mutate: (items) => { items.length = 0; },
    expect: (items) => assert.equal(items.length, 1)
  },
  {
    name: "reviews",
    create: () => createReview({ jobId: "job_1", rating: 5, comment: "great" }),
    list: listReviews,
    mutate: (items) => items.push({ id: "evil" }),
    expect: (items) => assert.equal(items.length, 1)
  },
  {
    name: "messages",
    create: () => sendMessage({ threadId: "thr_1", text: "hello" }),
    list: listMessages,
    mutate: (items) => items.pop(),
    expect: (items) => assert.equal(items.length, 1)
  },
  {
    name: "notifications",
    create: () => createNotification({ userId: "usr_1", title: "Ping" }),
    list: listNotifications,
    mutate: (items) => items.unshift({ id: "evil" }),
    expect: (items) => assert.equal(items.length, 1)
  }
];

test("list services return defensive snapshots", async () => {
  for (const entry of cases) {
    const created = await entry.create();
    const first = await entry.list();

    assert.equal(first.length, 1, `${entry.name} should have one item`);
    assert.notEqual(first, await entry.list(), `${entry.name} should return a fresh array`);

    entry.mutate(first);
    entry.expect(await entry.list());
    assert.deepEqual((await entry.list())[0], created, `${entry.name} backing store should stay intact`);
  }
});
