import { pathToFileURL } from "node:url";

export const MAX_ATTEMPTS = 5;

export function commitSubject(prNumber) {
  return `chore: update leaderboard for PR #${prNumber}`;
}

function required(env, name) {
  const value = env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function parseInputs(env) {
  const token = required(env, "GH_TOKEN");
  const defaultBranch = required(env, "DEFAULT_BRANCH");
  const repository = required(env, "GITHUB_REPOSITORY");
  const prUser = required(env, "PR_USER");
  const prNumber = required(env, "PR_NUMBER");

  if (!/^\d+$/.test(prNumber)) {
    throw new Error("PR_NUMBER must contain digits only");
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error("GITHUB_REPOSITORY must be owner/name");
  }
  if (defaultBranch.startsWith("-") || defaultBranch.includes("\0")) {
    throw new Error("DEFAULT_BRANCH is invalid");
  }

  return { token, defaultBranch, repository, prUser, prNumber };
}

export function incrementLeaderboardText(source, user) {
  const leaderboard = source.trim() ? JSON.parse(source) : {};
  if (leaderboard === null || Array.isArray(leaderboard) || typeof leaderboard !== "object") {
    throw new Error("leaderboard.json must contain a JSON object");
  }

  const current = leaderboard[user] ?? 0;
  if (typeof current !== "number" || !Number.isFinite(current)) {
    throw new Error(`leaderboard entry for ${user} must be a finite number`);
  }

  leaderboard[user] = current + 1;
  return `${JSON.stringify(leaderboard, null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  parseInputs(process.env);
}
