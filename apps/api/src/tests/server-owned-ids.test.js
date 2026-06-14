import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";
import { createUser } from "../services/userService.js";

test("createUser ignores client-controlled id fields", async () => {
  const user = await createUser({
    id: "usr_attacker_controlled",
    name: "Example User",
    email: "user@example.com",
  });

  assert.match(user.id, /^usr_\d+$/);
  assert.notEqual(user.id, "usr_attacker_controlled");
  assert.equal(user.name, "Example User");
  assert.equal(user.email, "user@example.com");
});

test("createProposal ignores client-controlled id fields", async () => {
  const proposal = await createProposal({
    id: "prp_attacker_controlled",
    jobId: "job_123",
    freelancerId: "usr_123",
    coverLetter: "I can complete this job.",
  });

  assert.match(proposal.id, /^prp_\d+$/);
  assert.notEqual(proposal.id, "prp_attacker_controlled");
  assert.equal(proposal.jobId, "job_123");
  assert.equal(proposal.freelancerId, "usr_123");
  assert.equal(proposal.coverLetter, "I can complete this job.");
});
