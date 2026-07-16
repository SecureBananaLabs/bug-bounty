import { pathToFileURL } from "node:url";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

  const next = current + 1;
  const key = JSON.stringify(user);
  if (Object.prototype.hasOwnProperty.call(leaderboard, user)) {
    const valuePattern = new RegExp(`(^[ \\t]*${escapeRegExp(key)}[ \\t]*:[ \\t]*)(-?(?:0|[1-9]\\d*)(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)(?=[ \\t]*(?:,|$))`, "m");
    const match = valuePattern.exec(source);
    if (!match) throw new Error(`leaderboard entry for ${user} must be a top-level number`);
    return `${source.slice(0, match.index)}${match[1]}${next}${source.slice(match.index + match[0].length)}`;
  }

  const closeIndex = source.lastIndexOf("}");
  const lineEnding = source.includes("\r\n") ? "\r\n" : "\n";
  const indentation = source.match(new RegExp(`${lineEnding}([ \\t]+)${escapeRegExp(JSON.stringify(Object.keys(leaderboard)[0] ?? ""))}`))?.[1] ?? "  ";
  const beforeClose = source.slice(0, closeIndex);
  const trailingWhitespace = beforeClose.match(/\s*$/)?.[0] ?? "";
  const content = beforeClose.slice(0, beforeClose.length - trailingWhitespace.length);
  const prefix = Object.keys(leaderboard).length ? `,${lineEnding}` : lineEnding;
  return `${content}${prefix}${indentation}${key}: ${next}${lineEnding}}${source.slice(closeIndex + 1)}`;
}

function defaultGit(args) {
  const completed = spawnSync("git", args, { encoding: "utf8" });
  return {
    status: completed.status ?? 1,
    stdout: completed.stdout ?? "",
    stderr: completed.stderr ?? completed.error?.message ?? "",
  };
}

const defaultFile = {
  exists: existsSync,
  read: (path) => readFileSync(path, "utf8"),
  write: (path, contents) => writeFileSync(path, contents, "utf8"),
};

function requireGit(result, operation, token) {
  if (result.status === 0) return result;
  const detail = result.stderr.replaceAll(token, "[redacted]").trim();
  throw new Error(`${operation} failed${detail ? `: ${detail}` : ""}`);
}

export async function runUpdate({
  inputs,
  git = defaultGit,
  file = defaultFile,
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  log = (message) => console.log(message),
} = {}) {
  const { token, defaultBranch, repository, prUser, prNumber } = inputs;
  const subject = commitSubject(prNumber);
  const remoteUrl = `https://x-access-token:${token}@github.com/${repository}.git`;

  requireGit(git(["config", "user.name", "github-actions[bot]"]), "configure Git user", token);
  requireGit(git(["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]), "configure Git email", token);
  requireGit(git(["remote", "set-url", "origin", remoteUrl]), "configure authenticated origin", token);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    requireGit(git(["fetch", "origin", defaultBranch]), "fetch default branch", token);
    requireGit(git(["reset", "--hard", `origin/${defaultBranch}`]), "reset to default branch", token);

    const existing = requireGit(
      git(["log", "--format=%s", `--grep=^${subject}$`, "-n", "1"]),
      "check idempotency commit",
      token,
    );
    if (existing.stdout.trim()) return "already-counted";

    const source = file.exists("leaderboard.json") ? file.read("leaderboard.json") : "{}\n";
    file.write("leaderboard.json", incrementLeaderboardText(source, prUser));
    requireGit(git(["add", "leaderboard.json"]), "stage leaderboard", token);

    const diff = git(["diff", "--cached", "--quiet", "--", "leaderboard.json"]);
    if (diff.status === 0) return "no-change";
    if (diff.status !== 1) requireGit(diff, "inspect staged leaderboard", token);

    requireGit(git(["commit", "-m", subject]), "commit leaderboard", token);
    const push = git(["push", "origin", `HEAD:${defaultBranch}`]);
    if (push.status === 0) return "updated";

    if (attempt === MAX_ATTEMPTS) {
      const detail = push.stderr.replaceAll(token, "[redacted]").trim();
      throw new Error(`leaderboard push failed after ${MAX_ATTEMPTS} attempts${detail ? `: ${detail}` : ""}`);
    }

    log(`Push attempt ${attempt} lost a race; recomputing from origin/${defaultBranch}.`);
    await sleep(attempt * 250);
  }

  throw new Error("unreachable retry state");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const inputs = parseInputs(process.env);
  runUpdate({ inputs }).then(
    (status) => console.log(`Leaderboard update: ${status}`),
    (error) => {
      console.error(error.message);
      process.exitCode = 1;
    },
  );
}
