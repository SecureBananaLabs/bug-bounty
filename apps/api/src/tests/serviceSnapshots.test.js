import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

const services = [
  {
    name: "jobs",
    create: createJob,
    list: listJobs,
    payload: () => ({
      title: "Snapshot job",
      description: "A job used to verify service snapshots",
      budgetMin: 100,
      budgetMax: 200,
      categoryId: "cat_snapshot",
      skills: ["initial"]
    }),
    listField: "skills"
  },
  {
    name: "messages",
    create: sendMessage,
    list: listMessages,
    payload: () => ({ recipientId: "usr_target", body: "Snapshot message", tags: ["initial"] }),
    listField: "tags"
  },
  {
    name: "notifications",
    create: createNotification,
    list: listNotifications,
    payload: () => ({ userId: "usr_target", title: "Snapshot notification", tags: ["initial"] }),
    listField: "tags"
  },
  {
    name: "proposals",
    create: createProposal,
    list: listProposals,
    payload: () => ({ jobId: "job_target", coverLetter: "Snapshot proposal", tags: ["initial"] }),
    listField: "tags"
  },
  {
    name: "reviews",
    create: createReview,
    list: listReviews,
    payload: () => ({ subjectId: "usr_target", rating: 5, tags: ["initial"] }),
    listField: "tags"
  },
  {
    name: "users",
    create: createUser,
    list: listUsers,
    payload: () => ({ email: "snapshot@example.com", name: "Snapshot User", tags: ["initial"] }),
    listField: "tags"
  }
];

for (const service of services) {
  test(`${service.name} service returns defensive snapshots`, async () => {
    const before = await service.list();
    const payload = service.payload();
    const created = await service.create(payload);
    const field = service.listField;

    payload[field].push("payload-mutation");
    created[field].push("created-mutation");

    const afterCreate = await service.list();
    assert.equal(afterCreate.length, before.length + 1);

    const listed = afterCreate.find((record) => record.id === created.id);
    assert.deepEqual(listed[field], ["initial"]);

    afterCreate.push({ id: "external-record" });
    listed[field].push("listed-record-mutation");

    const afterListMutation = await service.list();
    const persisted = afterListMutation.find((record) => record.id === created.id);

    assert.equal(afterListMutation.length, before.length + 1);
    assert.deepEqual(persisted[field], ["initial"]);
  });
}
