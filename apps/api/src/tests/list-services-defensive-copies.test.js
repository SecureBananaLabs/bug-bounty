import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";
import { createJob, listJobs } from "../services/jobService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createReview, listReviews } from "../services/reviewService.js";

async function assertDefensiveListCopy(name, createRecord, listRecords) {
  const created = await createRecord({ marker: `${name}-${Date.now()}`, note: "original" });

  const firstRead = await listRecords();
  const firstRecord = firstRead.find((record) => record.id === created.id);
  assert.ok(firstRecord, `${name}: created record should be listed`);

  firstRecord.note = "tampered";
  firstRead.push({ id: `fake-${name}` });

  const secondRead = await listRecords();
  const secondRecord = secondRead.find((record) => record.id === created.id);

  assert.ok(secondRecord, `${name}: created record should still be listed`);
  assert.equal(secondRecord.note, "original", `${name}: item mutation must not affect storage`);
  assert.equal(
    secondRead.some((record) => record.id === `fake-${name}`),
    false,
    `${name}: array mutation must not affect storage`
  );
}

test("list services return defensive copies", async () => {
  await assertDefensiveListCopy("users", createUser, listUsers);
  await assertDefensiveListCopy("jobs", createJob, listJobs);
  await assertDefensiveListCopy("proposals", createProposal, listProposals);
  await assertDefensiveListCopy("messages", sendMessage, listMessages);
  await assertDefensiveListCopy("notifications", createNotification, listNotifications);
  await assertDefensiveListCopy("reviews", createReview, listReviews);
});
