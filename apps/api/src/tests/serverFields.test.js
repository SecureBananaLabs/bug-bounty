import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";
import { sendMessage } from "../services/messageService.js";
import { createNotification } from "../services/notificationService.js";
import { createProposal } from "../services/proposalService.js";
import { createReview } from "../services/reviewService.js";
import { createUser } from "../services/userService.js";

test("creation services do not allow payloads to override server-managed fields", async () => {
  const originalNow = Date.now;
  Date.now = () => 12345;

  try {
    const user = await createUser({
      id: "client_user",
      email: "client@example.com",
      role: "client"
    });
    const job = await createJob({
      id: "client_job",
      status: "completed",
      title: "Website build",
      description: "Build a responsive marketing website",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat_web",
      skills: ["nextjs"]
    });
    const proposal = await createProposal({
      id: "client_proposal",
      coverLetter: "I can help with this project.",
      bidAmount: 250,
      estDuration: "1 week",
      jobId: "job_12345",
      freelancerId: "usr_12345"
    });
    const review = await createReview({
      id: "client_review",
      rating: 5,
      comment: "Great work",
      reviewerId: "usr_client",
      revieweeId: "usr_freelancer"
    });
    const message = await sendMessage({
      id: "client_message",
      body: "Hello",
      senderId: "usr_client",
      receiverId: "usr_freelancer",
      sentAt: "2000-01-01T00:00:00.000Z"
    });
    const notification = await createNotification({
      id: "client_notification",
      userId: "usr_client",
      title: "Proposal update",
      body: "A proposal changed",
      read: true
    });

    assert.equal(user.id, "usr_12345");
    assert.equal(job.id, "job_12345");
    assert.equal(job.status, "open");
    assert.equal(proposal.id, "prp_12345");
    assert.equal(review.id, "rev_12345");
    assert.equal(message.id, "msg_12345");
    assert.notEqual(message.sentAt, "2000-01-01T00:00:00.000Z");
    assert.equal(notification.id, "ntf_12345");
    assert.equal(notification.read, false);
  } finally {
    Date.now = originalNow;
  }
});
