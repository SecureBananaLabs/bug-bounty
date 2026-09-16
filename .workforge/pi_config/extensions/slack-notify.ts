/**
 * slack-notify.ts — Unified Windows + VPS Slack notify extension
 * SoT: VPS /home/deploy/.pi/agent/extensions/slack-notify.ts (synced to Windows via bootstrap)
 *
 * Fires on agent_settled (and agent_end fallback) when Pi is idle.
 * Unified webhook loading:
 *   1. env SLACK_WEBHOOK_URL
 *   2. Windows: %USERPROFILE%\.pi\secrets\slack.env
 *   3. Linux: /etc/workforge/slack.env
 * PI_SLACK_NOTIFY=0 disables.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

const MAX_CHUNK = 38000;
export const OUTPUT_LIMIT = 10000;

// Diagnostic helper — writes to multiple locations so isolated PI_CODING_AGENT_DIR is observable
// File-only by default; console output disabled to keep Pi UI clean.
// Enable console diag with PI_SLACK_NOTIFY_DIAG_CONSOLE=1
function diagLog(msg: string) {
	const line = `${new Date().toISOString()} pid=${process.pid} ${msg}\n`;
	const candidates = new Set<string>([
		join(tmpdir(), "slack-notify-diag.log"),
		"/tmp/slack-notify-diag.log",
	]);
	if (process.env.PI_CODING_AGENT_DIR) {
		candidates.add(join(process.env.PI_CODING_AGENT_DIR, "slack-notify-diag.log"));
	}
	// Windows temp also
	if (process.env.TEMP) candidates.add(join(process.env.TEMP, "slack-notify-diag.log"));
	for (const p of candidates) {
		try { appendFileSync(p, line); } catch {}
	}
	if (process.env.PI_SLACK_NOTIFY_DIAG_CONSOLE === "1" || process.env.SLACK_NOTIFY_DIAG_CONSOLE === "1") {
		try { console.error(`[slack-notify:diag] ${msg}`); } catch {}
	}
}

// Load marker
try {
	const marker = `${Date.now()}:${process.pid}:${new Date().toISOString()} PI_CODING_AGENT_DIR=${process.env.PI_CODING_AGENT_DIR ?? "(unset)"}`;
	const paths = [join(tmpdir(), "slack-notify-loaded"), "/tmp/slack-notify-loaded"];
	if (process.env.PI_CODING_AGENT_DIR) paths.push(join(process.env.PI_CODING_AGENT_DIR, "slack-notify-loaded"));
	for (const p of paths) { try { writeFileSync(p, marker); } catch {} }
	if (process.env.PI_SLACK_NOTIFY_DIAG_CONSOLE === "1" || process.env.SLACK_NOTIFY_DIAG_CONSOLE === "1") {
		try { console.error(`[slack-notify] loaded pid=${process.pid} dir=${process.env.PI_CODING_AGENT_DIR ?? "(unset)"}`); } catch {}
	}
} catch {}

interface TextBlock {
	type?: string;
	text?: string;
}
interface RoleMessage {
	role?: unknown;
	content?: unknown;
}

function isObj(b: unknown): b is Record<string, unknown> {
	return typeof b === "object" && b !== null;
}
function isTextBlockTyped(b: unknown): b is TextBlock {
	return isObj(b) && b.type === "text" && typeof b.text === "string";
}
function isRoleMessage(m: unknown): m is RoleMessage {
	return typeof m === "object" && m !== null && "role" in m;
}

export function capText(text: string): string {
	if (text.length <= OUTPUT_LIMIT) return text;
	const notice = `\n\n[...output truncated: ${OUTPUT_LIMIT} of ${text.length} chars (hard limit)]\n\n`;
	const budget = OUTPUT_LIMIT - notice.length;
	const headLen = Math.floor(budget * 0.7);
	const tailLen = budget - headLen;
	return text.slice(0, headLen) + notice + (tailLen > 0 ? text.slice(-tailLen) : "");
}

function capAssistantMessage(msg: RoleMessage): RoleMessage | undefined {
	if (!Array.isArray(msg.content)) return undefined;
	const texts = msg.content.filter(isTextBlockTyped);
	if (texts.length === 0) return undefined;
	const total = texts.reduce((n: number, t) => n + t.text.length + 2, -2);
	if (total <= OUTPUT_LIMIT) return undefined;
	const capped = capText(texts.map((t) => t.text).join("\n\n"));
	let firstReplaced = false;
	const content: unknown[] = [];
	for (const b of msg.content) {
		if (!isTextBlockTyped(b)) content.push(b);
		else if (!firstReplaced) { firstReplaced = true; content.push({ ...b, text: capped }); }
	}
	return { ...msg, content };
}

function readWebhookFromFile(path: string): string {
	try {
		const text = readFileSync(path, "utf-8");
		const m = text.match(/^SLACK_WEBHOOK_URL=(\S+)\s*$/m);
		return m ? m[1] : "";
	} catch { return ""; }
}

function loadWebhook(): string {
	if (process.env.PI_SLACK_NOTIFY === "0") return "";
	if (process.env.SLACK_WEBHOOK_URL) return process.env.SLACK_WEBHOOK_URL;
	const winPath = join(homedir(), ".pi", "secrets", "slack.env");
	const candidates = process.platform === "win32"
		? [winPath, "/etc/workforge/slack.env"]
		: ["/etc/workforge/slack.env", winPath];
	for (const p of candidates) {
		const v = readWebhookFromFile(p);
		if (v) return v;
	}
	return "";
}

function extractText(content: unknown): string {
	if (typeof content === "string") return content;
	if (Array.isArray(content)) {
		const parts: string[] = [];
		for (const b of content) if (isTextBlockTyped(b) && b.text.length > 0) parts.push(b.text);
		if (parts.length > 0) return parts.join("\n");
	}
	return "";
}
function lastAssistantText(messages: readonly unknown[]): string {
	for (let i = messages.length - 1; i >= 0; i--) {
		const msg = messages[i];
		if (isRoleMessage(msg) && msg.role === "assistant") {
			const text = extractText(msg.content);
			if (text.trim()) return text;
		}
	}
	return "";
}
export function chunks(text: string): string[] {
	if (text.length <= MAX_CHUNK) return [text];
	const parts: string[] = [];
	let rest = text;
	while (rest.length > 0) { parts.push(rest.slice(0, MAX_CHUNK)); rest = rest.slice(MAX_CHUNK); }
	return parts;
}
function collectMessages(ctx: { sessionManager?: { buildContextEntries?: () => unknown[] } }): unknown[] {
	const entries = ctx.sessionManager?.buildContextEntries?.() ?? [];
	const out: unknown[] = [];
	for (const e of entries) {
		if (isRoleMessage(e)) out.push(e);
		else if (isObj(e) && "message" in e && isRoleMessage((e as { message: unknown }).message)) out.push((e as { message: unknown }).message);
	}
	return out;
}

async function postToSlack(webhook: string, payload: string): Promise<number> {
	try {
		const res = await fetch(webhook, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: payload,
			signal: AbortSignal.timeout(15000),
		});
		return res.status;
	} catch (err) {
		console.error("[slack-notify] send failed:", err instanceof Error ? err.message : String(err));
		return 0;
	}
}
function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }
async function sendWithRetry(webhook: string, payload: string): Promise<void> {
	let code = await postToSlack(webhook, payload);
	diagLog(`postToSlack http=${code}`);
	if (code < 200 || code >= 300) {
		await sleep(1100);
		code = await postToSlack(webhook, payload);
		diagLog(`postToSlack retry http=${code}`);
		if (code < 200 || code >= 300) console.error(`[slack-notify] message not delivered (http ${code})`);
	}
}

export default function (pi: ExtensionAPI) {
	diagLog(`extension registered PID=${process.pid} PI_CODING_AGENT_DIR=${process.env.PI_CODING_AGENT_DIR ?? "(unset)"} extPath=slack-notify.ts`);
	if (process.env.PI_OUTPUT_CAP !== "0") {
		pi.on("message_end", (event) => {
			const msg = event.message;
			if (!isRoleMessage(msg) || msg.role !== "assistant") return undefined;
			const replacement = capAssistantMessage(msg);
			return replacement ? { message: replacement } : undefined;
		});
	}
	const notifiedRuns = new Set<string>();
	const handleSettled = async (_event: unknown, ctx: unknown) => {
		const c = ctx as { mode?: string; isIdle?: () => boolean; sessionManager?: unknown };
		const mode = String(c.mode ?? "unknown");
		const idle = typeof c.isIdle === "function" ? c.isIdle() : false;
		diagLog(`agent_settled reached mode=${mode} isIdle=${String(idle)} PI_SLACK_NOTIFY=${process.env.PI_SLACK_NOTIFY ?? "(unset)"} webhook_env=${process.env.SLACK_WEBHOOK_URL ? "set" : "unset"} PI_CODING_AGENT_DIR=${process.env.PI_CODING_AGENT_DIR ?? "(unset)"} sessionId=${process.env.PI_SESSION_ID ?? "(unset)"}`);
		if (process.env.PI_SLACK_NOTIFY === "0") { diagLog("guard: PI_SLACK_NOTIFY==0 -> suppressed"); return; }
		const _piDir = process.env.PI_CODING_AGENT_DIR ?? "";
		const _wfJob = (process.env as Record<string,string|undefined>)["WORKFORGE_JOB_ID"] ?? (process.env as Record<string,string|undefined>)["WORKFORGE_JOB"] ?? "";
		if (_wfJob || _piDir.includes("/workforge/workspaces") || _piDir.includes(".workforge/pi_config")) {
			diagLog();
			return;
		}
		diagLog(`guard: PI_SLACK_NOTIFY enabled`);
		diagLog(`guard: mode guard PASS (all modes allowed) mode=${mode}`);
		if (!idle) { diagLog(`guard: idle guard BLOCKED isIdle=false`); return; }
		diagLog(`guard: idle guard PASS`);
		const text = lastAssistantText(collectMessages(c as never));
		const empty = !text.trim();
		diagLog(`guard: final text empty=${String(empty)} len=${text.length}`);
		if (empty) return;
		const sm = c.sessionManager as { getSessionId?: () => string; getLeafId?: () => string | null } | undefined;
		const sessionId = sm?.getSessionId?.() ?? "";
		const leafId = sm?.getLeafId?.() ?? "";
		const runKey = `${sessionId}:${leafId}:${text.length}:${text.slice(0, 64)}`;
		const authoritativeKey = leafId ? `${sessionId}:${leafId}` : runKey;
		diagLog(`sessionId=${sessionId.slice(0,8)} leafId=${leafId.slice(0,8)} dedupeKey=${authoritativeKey.slice(0,120)}`);
		if (notifiedRuns.has(authoritativeKey)) { diagLog(`dedupe REJECTED`); return; }
		diagLog(`dedupe PASS`);
		notifiedRuns.add(authoritativeKey);
		const webhook = loadWebhook();
		diagLog(`webhook loaded=${String(!!webhook)} platform=${process.platform} homedir=${homedir()}`);
		if (!webhook) { diagLog("webhook empty -> abort"); return; }
		const header = `[Pi session ${process.env.PI_SESSION_ID ?? ""}] result`.trim();
		const parts = chunks(text);
		diagLog(`send attempt parts=${parts.length}`);
		for (let i = 0; i < parts.length; i++) {
			const label = parts.length > 1 ? ` (${i + 1}/${parts.length})` : "";
			await sendWithRetry(webhook, JSON.stringify({ text: `*${header}*${label}\n${parts[i]}` }));
			diagLog(`send part ${i+1}/${parts.length} done`);
			if (i < parts.length - 1) await sleep(1100);
		}
		diagLog(`HTTP result done`);
	};
	pi.on("agent_settled", handleSettled as never);
	pi.on("agent_end" as never, handleSettled as never);
	diagLog(`handlers registered: agent_settled + agent_end`);
}
