/**
 * Agent identity: Antigravity
 * OS: mac
 * CPU: arm64
 * Home Path: /Users/macminim1
 * Working Path: /Users/macminim1/Documents/efe
 * Shell: /bin/zsh
 *
 * - Maintain documentation integrity. Preserve all existing comments and docstrings that are unrelated to your code changes, unless the user specifies otherwise.
 */
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(["client", "freelancer"])
});
