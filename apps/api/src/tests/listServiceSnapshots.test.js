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
  test(`${name} list service returns defensive snapshots`, async () => {
    const originalTitle = `${name} list snapshot test`;
    const created = await createRecord({
      title: originalTitle,
      labels: [`${name}-original`]
    });

    const listedRecords = await listRecords();
    const listedRecord = listedRecords.find((record) => record.id === created.id);

    assert.ok(listedRecord);

    listedRecords.push({ id: `${name}-injected`, title: "injected" });
    listedRecords.length = 0;
    listedRecord.title = `${name} listed record mutated`;
    listedRecord.labels.push(`${name}-listed-record-mutated`);

    const storedRecords = await listRecords();
    const storedRecord = storedRecords.find((record) => record.id === created.id);

    assert.ok(storedRecord);
    assert.equal(storedRecord.title, originalTitle);
    assert.deepEqual(storedRecord.labels, [`${name}-original`]);
    assert.equal(
      storedRecords.some((record) => record.id === `${name}-injected`),
      false
    );
    assert.notEqual(storedRecords, listedRecords);
    assert.notEqual(storedRecord, listedRecord);
    assert.notEqual(storedRecord.labels, listedRecord.labels);
  });
}
