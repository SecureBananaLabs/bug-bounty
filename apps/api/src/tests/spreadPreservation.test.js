import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";
import { sendMessage } from "../services/messageService.js";

test("Job & Message creation field preservation", async (t) => {
  await t.test("createJob ignores client-controlled id and status", async () => {
    const job = await createJob({
      title: "Backend Engineer Needed",
      id: "job_INJECTED",
      status: "closed"
    });
    assert.notEqual(job.id, "job_INJECTED");
    assert.ok(job.id.startsWith("job_"));
    assert.equal(job.status, "open");
  });

  await t.test("sendMessage ignores client-controlled id and sentAt", async () => {
    const message = await sendMessage({
      content: "hello",
      id: "msg_INJECTED",
      sentAt: "2099-01-01T00:00:00Z"
    });
    assert.notEqual(message.id, "msg_INJECTED");
    assert.ok(message.id.startsWith("msg_"));
    assert.notEqual(message.sentAt, "2099-01-01T00:00:00Z");
  });
});
