import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";
import { createJob, listJobs } from "../services/jobService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

const listScenarios = [
  {
    name: "users",
    createRecord: () => createUser({ email: "snapshot-user@example.com", role: "freelancer" }),
    listRecords: listUsers
  },
  {
    name: "jobs",
    createRecord: () => createJob({ title: "Snapshot-safe job", budget: 1200 }),
    listRecords: listJobs
  },
  {
    name: "proposals",
    createRecord: () => createProposal({ jobId: "job_snapshot", freelancerId: "usr_snapshot" }),
    listRecords: listProposals
  },
  {
    name: "reviews",
    createRecord: () =>
      createReview({ reviewerId: "usr_reviewer", revieweeId: "usr_reviewee", rating: 5, comment: "Solid work" }),
    listRecords: listReviews
  },
  {
    name: "messages",
    createRecord: () =>
      sendMessage({ senderId: "usr_sender", receiverId: "usr_receiver", body: "Snapshot check" }),
    listRecords: listMessages
  },
  {
    name: "notifications",
    createRecord: () => createNotification({ userId: "usr_notify", title: "Milestone funded" }),
    listRecords: listNotifications
  }
];

for (const { name, createRecord, listRecords } of listScenarios) {
  test(`list ${name} returns a defensive snapshot`, async () => {
    const baseline = await listRecords();
    const createdRecord = await createRecord();

    const firstView = await listRecords();
    const createdIndex = firstView.findIndex((record) => record.id === createdRecord.id);

    assert.notEqual(createdIndex, -1);
    assert.equal(firstView[createdIndex], createdRecord);

    firstView.splice(createdIndex, 1);
    firstView.push({ id: `${name}_fake` });

    const secondView = await listRecords();
    const secondIndex = secondView.findIndex((record) => record.id === createdRecord.id);

    assert.equal(secondView.length, baseline.length + 1);
    assert.notEqual(secondIndex, -1);
    assert.equal(secondView[secondIndex], createdRecord);
    assert.equal(secondView.some((record) => record.id === `${name}_fake`), false);
  });
}
