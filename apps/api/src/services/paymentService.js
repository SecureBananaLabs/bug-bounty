import { listJobs } from "./jobService.js";

export async function createPaymentIntent(payload) {
  const jobs = await listJobs();
  const job = jobs.find((j) => j.id === payload.jobId);
  if (!job) {
    throw new Error("Job not found");
  }

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: job.budgetMax,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
