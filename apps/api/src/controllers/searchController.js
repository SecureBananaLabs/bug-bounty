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

import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res, next) {
  try {
    let q = typeof req.query.q === "string" ? req.query.q : "";
    q = q.trim();

    if (q.length > 200) {
      return fail(res, "Search query must not exceed 200 characters", 400);
    }

    const sanitized = q.replace(/<[^>]*>/g, "");
    return ok(res, await globalSearch(sanitized));
  } catch (err) {
    next(err);
  }
}
