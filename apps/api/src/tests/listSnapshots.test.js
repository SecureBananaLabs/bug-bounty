import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

async function assertListSnapshot({ create, list, record, mutateField, assertOriginal }) {
  await create(record);

  const listed = await list();
  const target = listed.at(-1);
  assert.ok(target);

  listed.push({ id: "injected-record" });
  mutateField(target);

  const later = await list();
  assert.equal(later.some((item) => item.id === "injected-record"), false);
  assertOriginal(later.at(-1));
}

test("list services return defensive snapshots of stored records", async () => {
  await assertListSnapshot({
    create: createJob,
    list: listJobs,
    record: {
      title: "Snapshot test job",
      description: "Verify job list snapshots",
      budgetMin: 100,
      budgetMax: 200,
      categoryId: "engineering",
      skills: ["node", "api"]
    },
    mutateField: (job) => {
      job.title = "mutated";
      job.skills.push("mutated-skill");
    },
    assertOriginal: (job) => {
      assert.equal(job.title, "Snapshot test job");
      assert.deepEqual(job.skills, ["node", "api"]);
    }
  });

  await assertListSnapshot({
    create: sendMessage,
    list: listMessages,
    record: { senderId: "usr_a", receiverId: "usr_b", body: "Hello" },
    mutateField: (message) => {
      message.body = "mutated";
    },
    assertOriginal: (message) => {
      assert.equal(message.body, "Hello");
    }
  });

  await assertListSnapshot({
    create: createNotification,
    list: listNotifications,
    record: { userId: "usr_a", type: "proposal", text: "Proposal updated" },
    mutateField: (notification) => {
      notification.text = "mutated";
      notification.read = true;
    },
    assertOriginal: (notification) => {
      assert.equal(notification.text, "Proposal updated");
      assert.equal(notification.read, false);
    }
  });

  await assertListSnapshot({
    create: createProposal,
    list: listProposals,
    record: { jobId: "job_a", freelancerId: "usr_b", bidAmount: 150, coverLetter: "I can help" },
    mutateField: (proposal) => {
      proposal.bidAmount = 1;
    },
    assertOriginal: (proposal) => {
      assert.equal(proposal.bidAmount, 150);
    }
  });

  await assertListSnapshot({
    create: createReview,
    list: listReviews,
    record: { reviewerId: "usr_a", revieweeId: "usr_b", rating: 5, comment: "Great work" },
    mutateField: (review) => {
      review.rating = 1;
    },
    assertOriginal: (review) => {
      assert.equal(review.rating, 5);
    }
  });

  await assertListSnapshot({
    create: createUser,
    list: listUsers,
    record: { email: "snapshot@example.com", role: "client", skills: ["hiring"] },
    mutateField: (user) => {
      user.email = "mutated@example.com";
      user.skills.push("mutated-skill");
    },
    assertOriginal: (user) => {
      assert.equal(user.email, "snapshot@example.com");
      assert.deepEqual(user.skills, ["hiring"]);
    }
  });
});
