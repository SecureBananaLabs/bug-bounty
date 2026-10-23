import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";
import { createJob, listJobs } from "../services/jobService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

describe("List Service Defensive Snapshot Isolation (#6346)", () => {
  it("listUsers returns a shallow snapshot array isolated from push/pop/splice/length mutations", async () => {
    const created = await createUser({ email: "snapshot@example.com", role: "freelancer" });
    const firstSnapshot = await listUsers();
    const initialCount = firstSnapshot.length;

    assert.ok(firstSnapshot.includes(created));

    firstSnapshot.push({ id: "fake_user" });
    firstSnapshot.pop();
    firstSnapshot.splice(0, 1);
    firstSnapshot.length = 0;

    const secondSnapshot = await listUsers();
    assert.notStrictEqual(firstSnapshot, secondSnapshot);
    assert.equal(secondSnapshot.length, initialCount);
    assert.ok(secondSnapshot.includes(created));
  });

  it("listJobs returns a shallow snapshot array isolated from caller array mutations", async () => {
    const created = await createJob({ title: "Audit Smart Contracts", budget: 2500 });
    const firstSnapshot = await listJobs();
    const initialCount = firstSnapshot.length;

    firstSnapshot.push({ id: "fake_job" });
    firstSnapshot.length = 0;

    const secondSnapshot = await listJobs();
    assert.notStrictEqual(firstSnapshot, secondSnapshot);
    assert.equal(secondSnapshot.length, initialCount);
    assert.ok(secondSnapshot.includes(created));
  });

  it("listProposals returns a shallow snapshot array isolated from caller array mutations", async () => {
    const created = await createProposal({ jobId: "job_1", bidAmount: 1800 });
    const firstSnapshot = await listProposals();
    const initialCount = firstSnapshot.length;

    firstSnapshot.splice(0, firstSnapshot.length);

    const secondSnapshot = await listProposals();
    assert.notStrictEqual(firstSnapshot, secondSnapshot);
    assert.equal(secondSnapshot.length, initialCount);
    assert.ok(secondSnapshot.includes(created));
  });

  it("listReviews, listMessages, and listNotifications return defensive array snapshots", async () => {
    const rev = await createReview({ rating: 5, comment: "Excellent" });
    const msg = await sendMessage({ senderId: "u1", text: "Hello" });
    const ntf = await createNotification({ userId: "u1", message: "Alert" });

    const revSnap = await listReviews();
    const msgSnap = await listMessages();
    const ntfSnap = await listNotifications();

    const revCount = revSnap.length;
    const msgCount = msgSnap.length;
    const ntfCount = ntfSnap.length;

    revSnap.length = 0;
    msgSnap.length = 0;
    ntfSnap.length = 0;

    const revAfter = await listReviews();
    const msgAfter = await listMessages();
    const ntfAfter = await listNotifications();

    assert.equal(revAfter.length, revCount);
    assert.equal(msgAfter.length, msgCount);
    assert.equal(ntfAfter.length, ntfCount);
    assert.ok(revAfter.includes(rev));
    assert.ok(msgAfter.includes(msg));
    assert.ok(ntfAfter.includes(ntf));
  });
});
