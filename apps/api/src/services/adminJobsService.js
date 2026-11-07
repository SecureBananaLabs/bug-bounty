import { getAdminData, nextAdminId } from "./adminData.js";

function getJobRecord(jobId) {
  return getAdminData().jobs.find((job) => job.id === jobId) ?? null;
}

function createOwnerNotification(job, reason) {
  const notification = {
    id: nextAdminId("ntf"),
    userId: job.ownerId,
    type: "job_moderation",
    message: `Your listing "${job.title}" was rejected: ${reason}`,
    createdAt: new Date().toISOString()
  };

  getAdminData().notifications.push(notification);
  return notification;
}

export async function listFlaggedJobs() {
  const jobs = getAdminData().jobs.filter((job) =>
    ["flagged", "escalated"].includes(job.status)
  );

  return {
    jobs,
    total: jobs.length
  };
}

export async function moderateJob(jobId, payload = {}, adminId = null) {
  const job = getJobRecord(jobId);
  if (!job) {
    const error = new Error("Job not found");
    error.status = 404;
    throw error;
  }

  if (!["flagged", "escalated", "under_review"].includes(job.status)) {
    const error = new Error("Only flagged jobs can be moderated");
    error.status = 409;
    throw error;
  }

  const action = payload.action;
  if (!["approve", "reject", "escalate"].includes(action)) {
    const error = new Error("Invalid moderation action");
    error.status = 400;
    throw error;
  }

  const moderatedAt = new Date().toISOString();
  if (action === "reject" && !payload.reason) {
    const error = new Error("A rejection reason is required");
    error.status = 400;
    throw error;
  }

  const moderationEntry = {
    action,
    reason: payload.reason ?? null,
    at: moderatedAt,
    by: adminId
  };

  job.moderationHistory = [...(job.moderationHistory ?? []), moderationEntry];
  job.updatedAt = moderatedAt;

  if (action === "approve") {
    job.status = "approved";
    job.flagReason = null;
    return {
      job
    };
  }

  if (action === "escalate") {
    job.status = "escalated";
    return {
      job
    };
  }

  job.status = "rejected";
  job.rejectionReason = payload.reason;
  job.flagReason = payload.reason;
  const notification = createOwnerNotification(job, payload.reason);

  return {
    job,
    notification
  };
}
