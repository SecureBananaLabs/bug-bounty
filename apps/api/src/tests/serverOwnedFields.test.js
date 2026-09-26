import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { listMessages, sendMessage } from "../services/messageService.js";

test("sendMessage preserves server-owned id and sentAt", async () => {
  const beforeCount = (await listMessages()).length;
  const message = await sendMessage({
    content: "hello",
    id: "msg_INJECTED",
    sentAt: "2099-01-01T00:00:00.000Z",
  });

  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.id, "msg_INJECTED");
  assert.notEqual(message.sentAt, "2099-01-01T00:00:00.000Z");
  assert.equal(message.content, "hello");
  assert.equal((await listMessages()).length, beforeCount + 1);
});

test("createJob preserves server-owned id and status", async () => {
  const beforeCount = (await listJobs()).length;
  const job = await createJob({
    title: "test",
    id: "job_INJECTED",
    status: "closed",
  });

  assert.match(job.id, /^job_\d+$/);
  assert.notEqual(job.id, "job_INJECTED");
  assert.equal(job.status, "open");
  assert.equal(job.title, "test");
  assert.equal((await listJobs()).length, beforeCount + 1);
});
