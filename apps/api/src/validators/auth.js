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

import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const refreshSchema = z.object({
  refreshToken: z.string()
});

