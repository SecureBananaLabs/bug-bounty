import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";
import { createJob, listJobs } from "../services/jobService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

test("listUsers returns a defensive copy", async () => {
  const user = await createUser({ name: "Alice" });
  const list = await listUsers();
  const origLength = list.length;

  // Mutate the returned array
  list.push({ id: "hacker" });
  assert.equal(list.length, origLength + 1);

  // Verify backing store is unaffected
  const list2 = await listUsers();
  assert.equal(list2.length, origLength);
});

test("listJobs returns a defensive copy", async () => {
  const job = await createJob({ title: "Test" });
  const list = await listJobs();
  const origLength = list.length;

  list.push({ id: "hacker" });
  assert.equal(list.length, origLength + 1);

  const list2 = await listJobs();
  assert.equal(list2.length, origLength);
});

test("listProposals returns a defensive copy", async () => {
  const proposal = await createProposal({ amount: 100 });
  const list = await listProposals();
  const origLength = list.length;

  list.push({ id: "hacker" });
  assert.equal(list.length, origLength + 1);

  const list2 = await listProposals();
  assert.equal(list2.length, origLength);
});

test("listReviews returns a defensive copy", async () => {
  const review = await createReview({ rating: 5 });
  const list = await listReviews();
  const origLength = list.length;

  list.push({ id: "hacker" });
  assert.equal(list.length, origLength + 1);

  const list2 = await listReviews();
  assert.equal(list2.length, origLength);
});

test("listMessages returns a defensive copy", async () => {
  const msg = await sendMessage({ text: "Hello" });
  const list = await listMessages();
  const origLength = list.length;

  list.push({ id: "hacker" });
  assert.equal(list.length, origLength + 1);

  const list2 = await listMessages();
  assert.equal(list2.length, origLength);
});

test("listNotifications returns a defensive copy", async () => {
  const notif = await createNotification({ message: "Test" });
  const list = await listNotifications();
  const origLength = list.length;

  list.push({ id: "hacker" });
  assert.equal(list.length, origLength + 1);

  const list2 = await listNotifications();
  assert.equal(list2.length, origLength);
});
