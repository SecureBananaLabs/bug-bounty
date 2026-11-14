import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

const cases = [
  {
    name: "jobs",
    create: createJob,
    payload: () => ({
      title: "Build billing flow",
      description: "Implement billing milestones",
      budgetMin: 100,
      budgetMax: 200,
      categoryId: "cat_platform",
      skills: ["Node.js"],
    }),
    list: listJobs,
    arrayField: "skills",
    mutableField: "title",
    expectedMutableValue: "Build billing flow",
  },
  {
    name: "proposals",
    create: createProposal,
    payload: () => ({
      jobId: "job_snapshot",
      freelancerId: "usr_snapshot",
      coverLetter: "I can help",
      milestones: ["draft"],
    }),
    list: listProposals,
    arrayField: "milestones",
    mutableField: "coverLetter",
    expectedMutableValue: "I can help",
  },
  {
    name: "reviews",
    create: createReview,
    payload: () => ({
      jobId: "job_snapshot",
      reviewerId: "usr_snapshot",
      rating: 5,
      tags: ["fast"],
    }),
    list: listReviews,
    arrayField: "tags",
    mutableField: "rating",
    expectedMutableValue: 5,
  },
  {
    name: "messages",
    create: sendMessage,
    payload: () => ({
      conversationId: "conv_snapshot",
      senderId: "usr_snapshot",
      body: "hello",
      attachments: ["brief.pdf"],
    }),
    list: listMessages,
    arrayField: "attachments",
    mutableField: "body",
    expectedMutableValue: "hello",
  },
  {
    name: "notifications",
    create: createNotification,
    payload: () => ({
      userId: "usr_snapshot",
      message: "new proposal",
      actions: ["open"],
    }),
    list: listNotifications,
    arrayField: "actions",
    mutableField: "message",
    expectedMutableValue: "new proposal",
  },
  {
    name: "users",
    create: createUser,
    payload: () => ({
      email: "snapshot@example.com",
      name: "Snapshot User",
      skills: ["JavaScript"],
    }),
    list: listUsers,
    arrayField: "skills",
    mutableField: "name",
    expectedMutableValue: "Snapshot User",
  },
];

describe("create service snapshots", () => {
  for (const testCase of cases) {
    it(`keeps stored ${testCase.name} isolated from returned object and payload array mutations`, async () => {
      const payload = testCase.payload();
      const originalArray = [...payload[testCase.arrayField]];
      const created = await testCase.create(payload);

      payload[testCase.mutableField] = "mutated original payload";
      payload[testCase.arrayField].push("mutated original payload");
      created[testCase.mutableField] = "mutated outside service";
      created[testCase.arrayField].push("mutated outside service");

      const stored = (await testCase.list()).find((record) => record.id === created.id);

      assert.equal(stored[testCase.mutableField], testCase.expectedMutableValue);
      assert.deepEqual(stored[testCase.arrayField], originalArray);
      assert.notEqual(stored, created);
      assert.notEqual(stored[testCase.arrayField], created[testCase.arrayField]);
    });
  }
});
