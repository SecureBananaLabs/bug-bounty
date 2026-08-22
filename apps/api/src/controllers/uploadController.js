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

export async function uploadFile(req, res, next) {
  try {
    return ok(res, {
      filename: req.file?.originalname ?? null,
      status: req.file ? "uploaded" : "no-file"
    }, 201);
  } catch (err) {
    next(err);
  }
}

