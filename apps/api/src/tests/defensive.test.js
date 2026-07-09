import test from "node:test";
import assert from "node:assert";
import { listUsers, createUser } from "../services/userService.js";
import { listJobs, createJob } from "../services/jobService.js";
import { listProposals, createProposal } from "../services/proposalService.js";
import { listReviews, createReview } from "../services/reviewService.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { listNotifications, createNotification } from "../services/notificationService.js";

test("Defensive copy list functions test", async (t) => {
  await t.test("listUsers should return defensive shallow copies", async () => {
    await createUser({ name: "Alice" });
    const list1 = await listUsers();
    assert.equal(list1.length, 1);
    
    // Mutate the returned array
    list1.push({ name: "Hacker" });
    
    const list2 = await listUsers();
    assert.equal(list2.length, 1, "The backing users store should not be mutated");
  });

  await t.test("listJobs should return defensive shallow copies", async () => {
    await createJob({ title: "SRE Job" });
    const list1 = await listJobs();
    assert.equal(list1.length, 1);
    
    list1.push({ title: "Fake Job" });
    
    const list2 = await listJobs();
    assert.equal(list2.length, 1, "The backing jobs store should not be mutated");
  });

  await t.test("listProposals should return defensive shallow copies", async () => {
    await createProposal({ coverLetter: "Hire me" });
    const list1 = await listProposals();
    assert.equal(list1.length, 1);
    
    list1.push({ coverLetter: "Fake Proposal" });
    
    const list2 = await listProposals();
    assert.equal(list2.length, 1, "The backing proposals store should not be mutated");
  });

  await t.test("listReviews should return defensive shallow copies", async () => {
    await createReview({ comment: "Great client" });
    const list1 = await listReviews();
    assert.equal(list1.length, 1);
    
    list1.push({ comment: "Fake Review" });
    
    const list2 = await listReviews();
    assert.equal(list2.length, 1, "The backing reviews store should not be mutated");
  });

  await t.test("listMessages should return defensive shallow copies", async () => {
    await sendMessage({ content: "Hello" });
    const list1 = await listMessages();
    assert.equal(list1.length, 1);
    
    list1.push({ content: "Fake Msg" });
    
    const list2 = await listMessages();
    assert.equal(list2.length, 1, "The backing messages store should not be mutated");
  });

  await t.test("listNotifications should return defensive shallow copies", async () => {
    await createNotification({ content: "New job alert" });
    const list1 = await listNotifications();
    assert.equal(list1.length, 1);
    
    list1.push({ content: "Fake Notif" });
    
    const list2 = await listNotifications();
    assert.equal(list2.length, 1, "The backing notifications store should not be mutated");
  });
});
