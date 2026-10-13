export function validateCreateProposal(payload) {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Invalid proposal payload" };
  }
  const { jobId, freelancerId, coverLetter, bidAmount, estimatedDuration } = payload;
  if (!jobId || typeof jobId !== "string" || jobId.trim() === "") {
    return { ok: false, error: "jobId is required" };
  }
  if (!freelancerId || typeof freelancerId !== "string" || freelancerId.trim() === "") {
    return { ok: false, error: "freelancerId is required" };
  }
  if (!coverLetter || typeof coverLetter !== "string" || coverLetter.trim().length < 10) {
    return { ok: false, error: "coverLetter must be at least 10 characters" };
  }
  if (typeof bidAmount !== "number" || isNaN(bidAmount) || bidAmount <= 0) {
    return { ok: false, error: "bidAmount must be a positive number greater than zero" };
  }
  if (!estimatedDuration || typeof estimatedDuration !== "string" || estimatedDuration.trim().length < 2) {
    return { ok: false, error: "estimatedDuration must be at least 2 characters" };
  }
  if (estimatedDuration.trim().length > 50) {
    return { ok: false, error: "estimatedDuration cannot exceed 50 characters" };
  }

  return {
    ok: true,
    data: {
      jobId: jobId.trim(),
      freelancerId: freelancerId.trim(),
      coverLetter: coverLetter.trim(),
      bidAmount,
      estimatedDuration: estimatedDuration.trim()
    }
  };
}
