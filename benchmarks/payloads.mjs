/**
 * Realistic payload builders for #30 benchmarks.
 *
 * Shapes mirror the server-side contracts so the suite measures real handler
 * work instead of 400-validation paths:
 * - register/login/job: apps/api/src/validators/*.js (zod schemas)
 * - payment: apps/api/src/services/paymentService.js ({amount, currency})
 * - others: echo-style services; representative production-shaped documents.
 */
import { randomUUID } from "node:crypto";

export function buildPayload(kind, seq) {
  switch (kind) {
    case "register":
      return {
        email: `bench${seq}@example.com`,
        password: "Benchmark-123",
        role: "client",
      };
    case "login":
      return { email: "bench@example.com", password: "Benchmark-123" };
    case "empty":
      return {};
    case "user":
      return {
        name: "Benchmark Freelancer",
        email: `bench.user${seq}@example.com`,
        role: "freelancer",
        skills: ["javascript", "nodejs", "react"],
      };
    case "job":
      return {
        title: `Load test website build ${seq}`,
        description:
          "A realistic mid-size freelance brief: marketing site with CMS, contact form, and analytics integration.",
        budgetMin: 500,
        budgetMax: 2500,
        categoryId: "web-development",
        skills: ["javascript", "react", "nodejs"],
      };
    case "proposal":
      return {
        jobId: `job_${seq}`,
        freelancerId: `usr_${seq}`,
        coverLetter:
          "I can deliver this milestone in two weeks with weekly demos and full test coverage.",
        bidAmount: 1200,
      };
    case "payment":
      return { amount: 120000, currency: "usd" };
    case "review":
      return {
        jobId: `job_${seq}`,
        reviewerId: `usr_client_${seq}`,
        revieweeId: `usr_freelancer_${seq}`,
        rating: 5,
        comment: "Delivered on time with excellent communication.",
      };
    case "message":
      return {
        threadId: `thread_${seq}`,
        senderId: `usr_client_${seq}`,
        body: "Can you share the staging link for the homepage milestone?",
      };
    case "notification":
      return {
        userId: `usr_${seq}`,
        type: "proposal_received",
        title: "New proposal received",
        referenceId: `prp_${seq}_${randomUUID().slice(0, 8)}`,
      };
    case "upload":
      return { __multipartFile: true, filename: `bench-${seq}.txt` };
    default:
      return {};
  }
}
