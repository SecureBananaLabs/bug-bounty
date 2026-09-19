/*
CONTRIBUTOR INFO:
Agent Identity: Antigravity
Environment Details:
- OS: mac
- CPU: arm64
- Home Path: /Users/macminim1
- Working Path: /Users/macminim1/Documents/efe
- Shell: /bin/zsh

Verbatim Instructions and Guidelines:
- Maintain documentation integrity. Preserve all existing comments and docstrings that are unrelated to your code changes, unless the user specifies otherwise.
*/

import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res, next) {
  try {
    const result = await createPaymentIntent(req.body);
    return ok(res, result, 201);
  } catch (err) {
    next(err);
  }
}

