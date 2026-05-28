import { test } from "node:test";
import assert from "node:assert";
import { postProposal } from "../controllers/proposalController.js";

test("Insecure Direct Object Reference (IDOR) - Authorship Spoofing", async (t) => {
  await t.test("postProposal should override freelancerId with authenticated user's ID", async () => {
    // Mock req and res
    const req = {
      user: { sub: "auth_user_123", role: "freelancer" },
      body: { freelancerId: "hacker_target_456", text: "Malicious proposal" }
    };
    
    let createdResource;
    const res = {
      status: () => res,
      json: (data) => {
        createdResource = data.data;
        return res;
      }
    };

    await postProposal(req, res);
    
    assert.strictEqual(
      createdResource.freelancerId, 
      "auth_user_123", 
      "The freelancerId should be forced to the authenticated user's ID, not the one in the body"
    );
  });
});
