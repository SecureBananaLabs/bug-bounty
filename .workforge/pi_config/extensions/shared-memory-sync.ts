/**
 * shared-memory-sync.ts — Pi WRITE → Shared Memory auto-sync
 * SoT: /home/deploy/.pi/agent/extensions/shared-memory-sync.ts
 * (NOTE: .pi/ is gitignored in /home/deploy with no remote; persistence route = DECISION_REQUIRED,
 *  runtime-effective immediately via extension auto-discovery.)
 *
 * Watches tool lifecycle:
 *   tool_call (pre) ......... hash existing file for edit/write targets
 *   tool_execution_end (post)  hash after, queue WRITE record
 *   agent_settled ............ flush queue → STATE update + CHANGES append + commit + push + remote verify
 *
 * Guards: PI_SHARED_MEMORY_SYNC=0 disables. /opt/docs paths excluded (no re-entry:
 * extension writes via node:fs, never via tools). Bash/READ-only never recorded.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const DOCS = process.env.PI_SMSYNC_DOCS ?? "/opt/docs";
const BRANCH = "main";
const SYNC_SELF = "shared-memory-sync";

function log(msg: string): void {
	try { console.error(`[shared-memory-sync] ${msg}`); } catch { /* noop */ }
}

function sha256(path: string): string {
	try {
		return createHash("sha256").update(readFileSync(path)).digest("hex").slice(0, 16);
	} catch {
		return "none";
	}
}

function git(args: string[]): string {
	return execFileSync("git", ["-C", DOCS, ...args], { encoding: "utf8", timeout: 30000 }).trim();
}

interface PendingWrite {
	path: string;
	op: string;
	before: string;
	after: string;
	tool: string;
}

const pending = new Map<string, PendingWrite>();
const preHashes = new Map<string, string>();
let flushing = false;

function projectOf(path: string): string | null {
	if (!path.startsWith("/opt/")) return null;
	const parts = path.split("/");
	if (parts[1] !== "opt" || !parts[2]) return null;
	if (parts[2] === "docs") {
		const proj = parts[3];
		if (proj && existsSync(`${DOCS}/${proj}/CHANGES.md`)) return proj;
		return null;
	}
	const proj = parts[2];
	if (existsSync(`${DOCS}/${proj}/CHANGES.md`)) return proj;
	return null;
}

function toolPath(toolName: string, args: unknown): string | null {
	if (toolName !== "edit" && toolName !== "write") return null;
	if (typeof args !== "object" || args === null) return null;
	const p = (args as Record<string, unknown>)["path"];
	return typeof p === "string" ? p : null;
}

export default function sharedMemorySync(pi: ExtensionAPI): void {
	pi.on("tool_call", (async (event: unknown) => {
		if (process.env.PI_SHARED_MEMORY_SYNC === "0") return;
		const e = event as { toolName?: string; input?: unknown; toolCallId?: string };
		const path = e.toolName ? toolPath(e.toolName, e.input) : null;
		if (!path || path.startsWith(`${DOCS}/`) || !e.toolCallId) return;
		preHashes.set(e.toolCallId, sha256(path));
	}) as never);

	pi.on("tool_execution_end", (async (event: unknown) => {
		if (process.env.PI_SHARED_MEMORY_SYNC === "0") return;
		const e = event as { toolName?: string; toolCallId?: string; isError?: boolean };
		if (!e.toolName || !e.toolCallId || e.isError) {
			if (e.toolCallId) preHashes.delete(e.toolCallId);
			return;
		}
		const path = toolPath(e.toolName, (e as { args?: unknown }).args);
		if (!path || path.startsWith(`${DOCS}/`)) {
			preHashes.delete(e.toolCallId);
			return;
		}
		if (!projectOf(path)) {
			preHashes.delete(e.toolCallId);
			return;
		}
		const before = preHashes.get(e.toolCallId) ?? "unknown";
		preHashes.delete(e.toolCallId);
		const after = sha256(path);
		if (before === after) return;
		pending.set(`${e.toolCallId}:${path}`, {
			path,
			op: e.toolName === "write" ? "create|modify" : "modify",
			before,
			after,
			tool: e.toolName,
		});
		log(`queued ${e.toolName} ${path} ${before}->${after}`);
	}) as never);

	pi.on("agent_settled", (async () => {
		if (process.env.PI_SHARED_MEMORY_SYNC === "0") return;
		if (flushing || pending.size === 0) return;
		flushing = true;
		try {
			await flush();
		} catch (err) {
			log(`SYNC FAILED (kept ${pending.size} pending for retry): ${String(err)}`);
		} finally {
			flushing = false;
		}
	}) as never);

	log("handlers registered: tool_call + tool_execution_end + agent_settled");
}

async function flush(): Promise<void> {
	const records = [...pending.values()];
	const byProject = new Map<string, PendingWrite[]>();
	for (const r of records) {
		const proj = projectOf(r.path);
		if (!proj) continue;
		const list = byProject.get(proj) ?? [];
		list.push(r);
		byProject.set(proj, list);
	}
	if (byProject.size === 0) {
		pending.clear();
		return;
	}
	const stamp = new Date().toISOString().replace(/\.\d+Z$/, "Z");
	const taskId = process.env.PI_SESSION_ID ?? "unknown-session";
	const touched: string[] = [];
	for (const [proj, list] of byProject) {
		const changesPath = `${DOCS}/${proj}/CHANGES.md`;
		const lines = list.map(
			(r) => `- ${r.op} \`${r.path}\` [${r.before} -> ${r.after}]`,
		);
		const entry = `\n### ${stamp} | ${SYNC_SELF} ${taskId.slice(0, 8)}\n- PROJECT: ${proj}\n- OPERATION: ${list.length === 1 ? list[0].op : "multi"}\n- CHANGED_PATHS:\n${lines.join("\n")}\n- BEFORE_HASH / AFTER_HASH: see paths\n- SOT: \`/opt/${proj === projectOf(list[0].path) ? proj : proj}\`\n- VERIFICATION: hash before/after via tool lifecycle hooks\n- SUMMARY: auto-synced Pi WRITE (${list.length} path(s))\n`;
		appendFileSync(changesPath, entry);
		touched.push(changesPath);
		touchState(proj, stamp, `auto-sync ${list.length} path(s)`);
		touched.push(`${DOCS}/${proj}/STATE.md`);
	}
	const dirty = git(["status", "--porcelain", ...touched]);
	if (!dirty) {
		log("nothing to commit");
	} else {
		git(["add", ...touched]);
		git(["commit", "-m", `${SYNC_SELF}: auto-sync Pi WRITE (${records.length} paths)`]);
		const head = git(["rev-parse", "HEAD"]);
		git(["push", "origin", BRANCH]); // throws on non-fast-forward: pending kept for retry
		pending.clear(); // local+remote now hold the records: retry must not duplicate
		const remote = execFileSync("git", ["-C", DOCS, "ls-remote", "origin", BRANCH], {
			encoding: "utf8",
			timeout: 30000,
		}).trim().split(/\s+/)[0];
		if (!head || !remote.startsWith(head.slice(0, 7))) {
			throw new Error(`remote verify mismatch local=${head} remote=${remote}`);
		}
		log(`pushed ${head.slice(0, 7)} remote verified`);
	}
	pending.clear();
}

function touchState(proj: string, stamp: string, summary: string): void {
	const statePath = `${DOCS}/${proj}/STATE.md`;
	try {
		const content = readFileSync(statePath, "utf8");
		const updated = content.replace(/updated_at: .*/, `updated_at: ${stamp.slice(0, 10)}`);
		const lines = updated.split("\n");
		const idx = lines.findIndex((l) => l.startsWith("## LAST VERIFIED"));
		if (idx >= 0) {
			lines.splice(idx + 1, 0, "", `- ${stamp}: ${summary} (see CHANGES.md).`);
			const autoLines = lines.filter((l) => l.startsWith("- 20") && l.includes("(see CHANGES.md)."));
			if (autoLines.length > 5) {
				const first = lines.findIndex((l) => l.startsWith("- 20") && l.includes("(see CHANGES.md)."));
				if (first >= 0) lines.splice(first, 2);
			}
			writeFileSync(statePath, lines.join("\n"));
		} else {
			writeFileSync(statePath, updated);
		}
	} catch (err) {
		log(`STATE touch skipped for ${proj}: ${String(err)}`);
	}
}
