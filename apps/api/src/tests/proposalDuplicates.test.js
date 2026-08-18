import test from "node:test";
import assert from "node:assert/strict";
import { postProposal } from "../controllers/proposalController.js";

function createResponse() {
  return {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test("postProposal rejects duplicate proposals for the same freelancer and job", async () => {
  const suffix = `${Date.now()}_${Math.random()}`;
  const request = {
    body: {
      coverLetter: "I can help with this implementation.",
      bidAmount: 750,
      estDuration: "1 week",
      jobId: `job_${suffix}`,
      freelancerId: `usr_${suffix}`
    }
  };

  const firstResponse = createResponse();
  await postProposal(request, firstResponse);

  const duplicateResponse = createResponse();
  await postProposal(request, duplicateResponse);

  assert.equal(firstResponse.statusCode, 201);
  assert.equal(duplicateResponse.statusCode, 409);
  assert.deepEqual(duplicateResponse.body, {
    success: false,
    message: "Freelancer already submitted a proposal for this job"
  });
});
