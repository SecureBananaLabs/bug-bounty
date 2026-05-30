import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

const createCases = [
  {
    name: "job",
    create: createJob,
    list: listJobs,
    payload: {
      title: "Build billing flow",
      description: "Implement billing milestones",
      budgetMin: 100,
      budgetMax: 200,
      categoryId: "cat_platform",
      skills: ["Node.js"]
    },
    field: "title"
  },
  {
    name: "proposal",
    create: createProposal,
    list: listProposals,
    payload: {
      coverLetter: "I can deliver this project safely.",
      bidAmount: 150,
      estDuration: "1 week",
      jobId: "job_snapshot",
      freelancerId: "usr_snapshot"
    },
    field: "coverLetter"
  },
  {
    name: "review",
    create: createReview,
    list: listReviews,
    payload: {
      rating: 5,
      comment: "Clear scope and fast communication.",
      reviewerId: "usr_reviewer",
      revieweeId: "usr_reviewee"
    },
    field: "comment"
  },
  {
    name: "message",
    create: sendMessage,
    list: listMessages,
    payload: {
      body: "Can you review the milestone?",
      senderId: "usr_sender",
      receiverId: "usr_receiver"
    },
    field: "body"
  },
  {
    name: "notification",
    create: createNotification,
    list: listNotifications,
    payload: {
      userId: "usr_notified",
      title: "Milestone updated",
      body: "A milestone changed state."
    },
    field: "body"
  },
  {
    name: "user",
    create: createUser,
    list: listUsers,
    payload: {
      email: "snapshot@example.com",
      name: "Snapshot User",
      role: "client"
    },
    field: "email"
  }
];

test("create services return snapshots instead of mutable stored records", async () => {
  for (const service of createCases) {
    const created = await service.create(service.payload);
    const originalValue = created[service.field];

    created[service.field] = `${service.name} mutated outside service`;

    const stored = (await service.list()).find((record) => record.id === created.id);

    assert.equal(stored[service.field], originalValue, service.name);
  }
});

test("createJob snapshots array fields from payload and response objects", async () => {
  const skills = ["Node.js"];
  const created = await createJob({
    title: "Build proposal inbox",
    description: "Implement the proposal inbox workflow",
    budgetMin: 150,
    budgetMax: 300,
    categoryId: "cat_platform",
    skills
  });

  skills.push("mutated from payload");
  created.skills.push("mutated from response");

  const stored = (await listJobs()).find((record) => record.id === created.id);

  assert.deepEqual(stored.skills, ["Node.js"]);
});
