/**
 * experimental-history-projection.ts — P4 CONDITIONAL STALE SUMMARY experiment (OPT-018)
 *
 * DISABLED_BY_DEFAULT=YES. Enable only inside an experiment session:
 *   PI_EXPERIMENTAL_HISTORY_PROJECTION=1
 *
 * Mechanism: `context` event only. Copies provider-bound messages, replaces
 * stale toolResult *content* with a short SUMMARY. Session JSONL untouched.
 * No LLM calls. Deterministic keyword vetoes only. Never deletes messages,
 * never breaks toolCall<->toolResult pairing (role/toolName/toolCallId kept).
 *
 * FROZEN (never touched by this file): AGENTS.md, system prompt,
 * settings.json, toolresult-minimize.ts, pi-context-prune, Pi core,
 * provider config, session JSONL persistence.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createHash } from "node:crypto";

const ENABLE_ENV = "PI_EXPERIMENTAL_HISTORY_PROJECTION";
const HEAD_BUDGET = 256;
const TAIL_BUDGET = 256;
const LATEST_KEEP_N = 1;

const EXACT_KEYWORDS: string[] = [
	// ja (substring matching; standalone generic words like 値 are excluded — see JA_COMPOSITE)
	"正確", "正確な", "一字一句", "全文", "原文", "数値",
	"キー", "設定値", "コピー", "抜き出し", "全部", "全件", "全行",
	// en (lowercased for matching; WORD-BOUNDARY matching — see hitVeto)
	"exact", "exactly", "verbatim", "literal", "precise", "value", "number",
	"id", "key", "config", "copy", "extract", "all", "every", "full", "complete",
];

/** Japanese composite veto conditions: BOTH substrings must be present (avoids generic-word FP). */
const JA_COMPOSITE_PAIRS: Array<[string, string]> = [
	["正確", "値"],
	["正確", "id"],
	["そのまま", "コピー"],
	["全行", "抽出"],
];

const TRANSFORM_KEYWORDS: string[] = [
	// ja
	"集計", "合計", "比較", "差分", "一覧", "全行", "抽出", "ソート",
	"件数", "カウント", "変換", "計算", "解析", "全て", "すべて",
	// en
	"aggregate", "sum", "compare", "diff", "list", "extract", "sort",
	"count", "transform", "calculate", "analyze", "all", "every",
];

function isEnabled(): boolean {
	return process.env[ENABLE_ENV] === "1";
}

function sha256(text: string): string {
	return createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16);
}

/** Extract deterministic path only when reliably available. Else undefined → RULE2 skipped. */
function extractPath(toolName: string, msg: Record<string, unknown>): string | undefined {
	const details = msg.details as Record<string, unknown> | undefined;
	const input = (details as Record<string, unknown> | undefined)?.["input"] as
		| Record<string, unknown>
		| undefined;
	// context-event messages may carry input inside details or top-level; check both.
	const topInput = msg.input as Record<string, unknown> | undefined;
	const path =
		(topInput?.["path"] as string | undefined) ??
		(input?.["path"] as string | undefined) ??
		(details?.["path"] as string | undefined);
	if ((toolName === "read" || toolName === "edit" || toolName === "write") && typeof path === "string" && path.length > 0) {
		return path;
	}
	return undefined;
}

function textOf(msg: Record<string, unknown>): string {
	const content = msg.content as Array<{ type?: string; text?: string }> | undefined;
	if (!Array.isArray(content)) return "";
	return content
		.filter((b) => b.type === "text" && typeof b.text === "string")
		.map((b) => b.text as string)
		.join("\n");
}

function textLength(msg: Record<string, unknown>): number {
	return Buffer.byteLength(textOf(msg), "utf8");
}

function refetchHint(toolName: string, path: string | undefined): string {
	if ((toolName === "read" || toolName === "edit" || toolName === "write") && path) {
		return `Use the read tool on ${path} (offset/limit) for the full content`;
	}
	if (toolName === "bash") return "Re-run the command to get the full output";
	if (toolName === "grep") return "Re-run grep with a higher limit; use read on matched files";
	if (toolName === "find" || toolName === "ls") return `Re-run ${toolName} for full results`;
	return "Re-run the tool to retrieve the full output";
}

function buildSummary(toolName: string, toolCallId: string, original: string, path: string | undefined): string {
	const size = Buffer.byteLength(original, "utf8");
	const head = original.slice(0, HEAD_BUDGET);
	const tail = original.length > HEAD_BUDGET + TAIL_BUDGET ? original.slice(-TAIL_BUDGET) : "";
	const lines: string[] = [
		"[STALE_TOOL_RESULT]",
		`toolName: ${toolName}`,
		`toolCallId: ${toolCallId}`,
		`size: ${size}`,
		`sha256: ${sha256(original)}`,
		`recovery: ${refetchHint(toolName, path)}`,
	];
	if (path) lines.push(`path: ${path}`);
	lines.push("", "HEAD:", head);
	if (tail) lines.push("", "TAIL:", tail);
	lines.push("", "[/STALE_TOOL_RESULT]");
	return lines.join("\n");
}

function lastUserText(messages: Array<Record<string, unknown>>): string {
	for (let i = messages.length - 1; i >= 0; i--) {
		if (messages[i].role === "user") return textOf(messages[i]).toLowerCase();
	}
	return "";
}

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Keyword veto hit test.
 * - ASCII (English) keywords: WORD-BOUNDARY matching (\bkw\b, case-insensitive),
 *   so "sum" matches "sum the values" but NOT "summarize this" / "summary of this";
 *   "all" does not match "install", "list" does not match "listing", etc.
 * - Non-ASCII (Japanese) keywords: plain substring matching.
 */
function hitVeto(text: string, keywords: string[]): boolean {
	const lower = text.toLowerCase();
	return keywords.some((k) => {
		if (/^[a-z0-9]+$/i.test(k)) {
		return new RegExp(`\\b${escapeRegExp(k)}\\b`, "i").test(text);
		}
		return lower.includes(k.toLowerCase());
	});
}

/** Composite JA veto: true when BOTH parts co-occur (case-insensitive substring). */
function hitComposite(text: string, pairs: Array<[string, string]>): boolean {
	const lower = text.toLowerCase();
	return pairs.some(([a, b]) => lower.includes(a.toLowerCase()) && lower.includes(b.toLowerCase()));
}

/** Minimal details for provider payload: drop potentially huge fields, keep recovery pointer. */
function minimalDetails(msg: Record<string, unknown>): unknown {
	const d = msg.details as Record<string, unknown> | undefined;
	if (d == null) return undefined;
	const keep: Record<string, unknown> = {};
	for (const k of ["fullOutputPath", "path"]) {
		if (typeof d[k] === "string") keep[k] = d[k];
	}
	keep["projected"] = true;
	return keep;
}

export default function (pi: ExtensionAPI) {
	if (!isEnabled()) {
		// Disabled by default: no hooks registered, zero behavior change.
		return;
	}
	console.log("[experimental-history-projection] ENABLED (experiment session only)");

	pi.on("context", async (event, ctx) => {
		const original = event.messages as Array<Record<string, unknown>>;
		// Deep-copy via structured serialization (messages are JSON-safe).
		const messages: Array<Record<string, unknown>> = JSON.parse(JSON.stringify(original));

		const idx: number[] = [];
		messages.forEach((m, i) => {
			if (m.role === "toolResult") idx.push(i);
		});
		if (idx.length === 0) return undefined;

		// RULE 0: errors always FULL. RULE 1: latest N=1 FULL.
		const latestSet = new Set(idx.slice(-LATEST_KEEP_N));

		// RULE 2 prep: group by deterministic path; latest per path FULL, older SUMMARY candidates.
		const byPath = new Map<string, number[]>();
		const paths = new Map<number, string>();
		for (const i of idx) {
			const m = messages[i];
			const p = extractPath(String(m.toolName ?? ""), m);
			if (p !== undefined) {
				paths.set(i, p);
				const arr = byPath.get(p) ?? [];
				arr.push(i);
				byPath.set(p, arr);
			}
		}
		const superseded = new Set<number>();
		const pathLatest = new Set<number>();
		for (const arr of byPath.values()) {
			if (arr.length > 1) {
				const latest = arr[arr.length - 1];
				pathLatest.add(latest);
				for (const i of arr) if (i !== latest) superseded.add(i);
			}
		}

		// RULE 3 + vetoes: keyword-based conservative veto on current request intent.
		const userText = lastUserText(messages);
		const veto =
			hitVeto(userText, EXACT_KEYWORDS) ||
			hitVeto(userText, TRANSFORM_KEYWORDS) ||
			hitComposite(userText, JA_COMPOSITE_PAIRS);

		let summarized = 0;
		for (const i of idx) {
			const m = messages[i];
			if (m.isError === true) continue; // RULE 0
			if (latestSet.has(i)) continue; // RULE 1
			if (pathLatest.has(i)) continue; // RULE 2 (latest per path)
			if (!superseded.has(i)) {
				// RULE 3: not superseded and veto hit → FULL.
				if (veto) continue;
				// RULE 3: non-superseded old result without veto → SUMMARY candidate.
			}
			// Superseded (RULE 2) old result → SUMMARY regardless of veto (latest kept FULL).
			const origText = textOf(m);
			if (origText.length === 0) continue;
			const summary = buildSummary(String(m.toolName ?? ""), String(m.toolCallId ?? ""), origText, paths.get(i));
			m.content = [{ type: "text", text: summary }];
			const md = minimalDetails(m);
			if (md === undefined) delete m.details;
			else m.details = md;
			// role / toolName / toolCallId preserved → pairing intact.
			summarized++;
		}

		try {
			const branch = ctx.sessionManager.getBranch();
			console.log(
				`[experimental-history-projection] branch=${String(branch)} summarized=${summarized}/${idx.length} veto=${veto ? "FULL-hold" : "off"}`,
			);
		} catch {
			console.log(`[experimental-history-projection] summarized=${summarized}/${idx.length}`);
		}
		return { messages };
	});
}

// Exported for offline fixture measurement (no LLM, no session writes).
export const __test__ = {
	EXACT_KEYWORDS,
	TRANSFORM_KEYWORDS,
	JA_COMPOSITE_PAIRS,
	extractPath,
	buildSummary,
	hitVeto,
	hitComposite,
	HEAD_BUDGET,
	TAIL_BUDGET,
};
