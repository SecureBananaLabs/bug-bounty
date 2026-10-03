import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

const cases = [
  ["job", createJob, listJobs],
  ["message", sendMessage, listMessages],
  ["notification", createNotification, listNotifications],
  ["proposal", createProposal, listProposals],
  ["review", createReview, listReviews],
  ["user", createUser, listUsers]
];

for (const [name, createRecord, listRecords] of cases) {
  test(`${name} create service returns defensive snapshots`, async () => {
    const labels = [`${name}-original`];
    const created = await createRecord({
      title: `${name} snapshot test`,
      labels
    });

    labels.push(`${name}-payload-mutated`);
    created.title = `${name} response mutated`;
    created.labels.push(`${name}-response-mutated`);

    const stored = (await listRecords()).find((record) => record.id === created.id);

    assert.ok(stored);
    assert.notEqual(stored, created);
    assert.equal(stored.title, `${name} snapshot test`);
    assert.deepEqual(stored.labels, [`${name}-original`]);
    assert.notEqual(stored.labels, labels);
    assert.notEqual(stored.labels, created.labels);
  });
}
