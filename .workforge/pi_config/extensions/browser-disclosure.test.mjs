#!/usr/bin/env node
/**
 * Disclosure tests for the playwright-cdp-bridge extension (AI-INPUT-CONTEXT-OPT-009).
 *
 * Verifies that the 7 browser_* tools are only LLM-visible when disclosure is
 * explicitly enabled (CLI flag --browser / TUI command /browser [on|off|toggle]),
 * while tool implementations, schemas, core tools, the Obsidian extension,
 * and other extensions stay untouched.
 *
 * Part A: unit tests against the extension factory with a mock `pi` API
 *         (extension loaded through jiti with the same aliases pi uses;
 *          child_process.spawn is stubbed so no MCP process is spawned).
 * Part B: end-to-end test with a real AgentSession + offline faux provider,
 *         capturing the actual per-request LLM tool set (default vs enabled).
 * Part C: regression checks (other extensions unchanged, cycles, reload).
 *
 * Run: node browser-disclosure.test.mjs
 * Requires: Chrome CDP at 127.0.0.1:9222 only for the Part B enabled run
 *           (Part A spawns nothing; Part B default run spawns nothing).
 */
import { createJiti } from "/home/deploy/.npm-global/lib/node_modules/@earendil-works/pi-coding-agent/node_modules/jiti/lib/jiti.mjs";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = join(__dirname, "playwright-cdp-bridge.ts");
const PI_ROOT = "/home/deploy/.npm-global/lib/node_modules/@earendil-works/pi-coding-agent";
const require = createRequire(import.meta.url);

const BROWSER_TOOL_NAMES = [
  "browser_tabs",
  "browser_navigate",
  "browser_snapshot",
  "browser_click",
  "browser_type",
  "browser_take_screenshot",
  "browser_close",
];
const CORE_TOOLS = ["read", "bash", "edit", "write"];

// Baseline tool definitions captured before the disclosure change (original registration).
const BASELINE_TOOLS = [
  {
    name: "browser_tabs",
    label: "browser_tabs",
    description: "List/manage browser tabs (CDP attach)",
    parameters: { type: "object", required: ["action"], properties: { action: { type: "string", description: "list|new|close|select" }, index: { type: "number" }, url: { type: "string" } } },
  },
  {
    name: "browser_navigate",
    label: "browser_navigate",
    description: "Navigate page to URL",
    parameters: { type: "object", required: ["url"], properties: { url: { type: "string" } } },
  },
  {
    name: "browser_snapshot",
    label: "browser_snapshot",
    description: "Capture accessibility snapshot",
    parameters: { type: "object", properties: { target: { type: "string" }, filename: { type: "string" }, depth: { type: "number" }, boxes: { type: "boolean" } } },
  },
  {
    name: "browser_click",
    label: "browser_click",
    description: "Click element by snapshot ref",
    parameters: { type: "object", required: ["target"], properties: { target: { type: "string" }, element: { type: "string" }, doubleClick: { type: "boolean" }, button: { type: "string" }, modifiers: { type: "array", items: { type: "string" } } } },
  },
  {
    name: "browser_type",
    label: "browser_type",
    description: "Type text into element",
    parameters: { type: "object", required: ["target", "text"], properties: { target: { type: "string" }, text: { type: "string" }, element: { type: "string" }, submit: { type: "boolean" }, slowly: { type: "boolean" } } },
  },
  {
    name: "browser_take_screenshot",
    label: "browser_take_screenshot",
    description: "Take screenshot",
    parameters: { type: "object", properties: { target: { type: "string" }, element: { type: "string" }, type: { type: "string" }, filename: { type: "string" }, fullPage: { type: "boolean" } } },
  },
  {
    name: "browser_close",
    label: "browser_close",
    description: "Close the page",
    parameters: { type: "object", properties: {} },
  },
];

const results = [];
function test(name, fn) {
  return (async () => {
    try {
      await fn();
      results.push({ name, ok: true });
    } catch (err) {
      results.push({ name, ok: false, error: err.message });
    }
  })();
}
function report() {
  let failed = 0;
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : "  -- " + r.error}`);
    if (!r.ok) failed++;
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed > 0 ? 1 : 0);
}

const jiti = createJiti(import.meta.url, {
  alias: {
    typebox: require.resolve("typebox", { paths: [PI_ROOT] }),
    "@earendil-works/pi-coding-agent": join(PI_ROOT, "index.js"),
  },
});
// Separate uncached instance to simulate a fresh module load (extension reload).
const jitiFresh = createJiti(import.meta.url, {
  moduleCache: false,
  alias: {
    typebox: require.resolve("typebox", { paths: [PI_ROOT] }),
    "@earendil-works/pi-coding-agent": join(PI_ROOT, "index.js"),
  },
});

// --- Hermeticity: stub child_process.spawn for Part A (no MCP process spawned) ---
const cp = require("node:child_process");
const origSpawn = cp.spawn;
function stubSpawn() { cp.spawn = () => { throw new Error("spawn stubbed (unit test)"); }; }
function restoreSpawn() { cp.spawn = origSpawn; }

function makeHarness({ flag, initialActive = CORE_TOOLS.concat(BROWSER_TOOL_NAMES) } = {}) {
  const registeredTools = [];
  const commands = [];
  const flags = [];
  const handlers = {};
  let active = initialActive.slice();
  const setCalls = [];
  const pi = {
    registerTool(t) { registeredTools.push(t); },
    registerFlag(name, opts) { flags.push({ name, opts }); },
    registerCommand(name, opts) { commands.push({ name, opts }); },
    on(ev, h) { (handlers[ev] ??= []).push(h); },
    getFlag() { return flag; },
    getActiveTools() { return active.slice(); },
    setActiveTools(names) { setCalls.push(names.slice()); active = names.slice(); },
  };
  return { pi, registeredTools, commands, flags, handlers, getActive: () => active.slice(), setCalls };
}

const loadFactory = async () => (await jiti.import(EXTENSION_PATH, { default: true }));
const sessionStartOf = (h) => h.handlers["session_start"][0];
const browserCommandOf = (h) => h.commands.find((c) => c.name === "browser");

// ---------------------------------------------------------------------------
// Part A: unit tests
// ---------------------------------------------------------------------------
stubSpawn();
await test("A1: registers exactly the 7 browser tools + flag + command + session_start", async () => {
  const h = makeHarness();
  const factory = await loadFactory();
  factory(h.pi);
  assert.deepEqual(h.registeredTools.map((t) => t.name), BROWSER_TOOL_NAMES);
  assert.deepEqual(h.flags.map((f) => f.name + ":" + f.opts.type), ["browser:boolean"]);
  assert.ok(h.commands.some((c) => c.name === "browser"), "command /browser registered");
  assert.ok(h.handlers["session_start"]?.length === 1, "session_start handler registered");
});

await test("A2: default state removes browser tools, core 4 stay visible", async () => {
  const h = makeHarness({ flag: undefined });
  const factory = await loadFactory();
  factory(h.pi);
  await sessionStartOf(h)({}, { ui: { notify() {} } });
  const active = h.getActive();
  for (const name of CORE_TOOLS) assert.ok(active.includes(name), `${name} visible`);
  for (const name of BROWSER_TOOL_NAMES) assert.ok(!active.includes(name), `${name} hidden`);
  assert.equal(h.setCalls.length, 1, "exactly one setActiveTools call");
});

await test("A3: enabled (flag) keeps all 7 browser tools visible", async () => {
  const h = makeHarness({ flag: true });
  const factory = await loadFactory();
  factory(h.pi);
  await sessionStartOf(h)({}, { ui: { notify() {} } });
  const active = h.getActive();
  for (const name of BROWSER_TOOL_NAMES) assert.ok(active.includes(name), `${name} visible`);
  for (const name of CORE_TOOLS) assert.ok(active.includes(name), `${name} visible`);
});

await test("A4: schemas identical to the original (pre-change) registration", async () => {
  const h = makeHarness();
  const factory = await loadFactory();
  factory(h.pi);
  const normalized = h.registeredTools.map((t) => ({
    name: t.name,
    label: t.label,
    description: t.description,
    parameters: JSON.parse(JSON.stringify(t.parameters)),
  }));
  assert.deepEqual(normalized, BASELINE_TOOLS);
});

await test("A5: execute implementation present and callable shape for all 7 tools", async () => {
  const h = makeHarness();
  const factory = await loadFactory();
  factory(h.pi);
  for (const t of h.registeredTools) {
    assert.equal(typeof t.execute, "function", `${t.name} has execute`);
    assert.equal(t.execute.length, 2, `${t.name} execute takes (id, params)`);
  }
});

await test("A6: disclosure filter never removes non-browser tools", async () => {
  const h = makeHarness({ initialActive: CORE_TOOLS.concat(["obsidian_read_note", "my_custom"]).concat(BROWSER_TOOL_NAMES) });
  const factory = await loadFactory();
  factory(h.pi);
  await sessionStartOf(h)({}, { ui: { notify() {} } });
  const active = h.getActive();
  for (const name of CORE_TOOLS) assert.ok(active.includes(name), `${name} kept`);
  assert.ok(active.includes("obsidian_read_note"), "non-browser extension tool kept");
  assert.ok(active.includes("my_custom"), "custom tool kept");
  for (const name of BROWSER_TOOL_NAMES) assert.ok(!active.includes(name), `${name} hidden`);
});

await test("A7: /browser on|off|toggle switches state without breaking runtime", async () => {
  const h = makeHarness();
  const factory = await loadFactory();
  factory(h.pi);
  const cmd = browserCommandOf(h);
  await sessionStartOf(h)({}, { ui: { notify() {} } });
  assert.equal(h.getActive().filter((n) => BROWSER_TOOL_NAMES.includes(n)).length, 0, "default hidden");
  await cmd.opts.handler("on", { ui: { notify() {} } });
  assert.equal(h.getActive().filter((n) => BROWSER_TOOL_NAMES.includes(n)).length, 7, "on -> visible");
  await cmd.opts.handler("off", { ui: { notify() {} } });
  assert.equal(h.getActive().filter((n) => BROWSER_TOOL_NAMES.includes(n)).length, 0, "off -> hidden");
  await cmd.opts.handler("", { ui: { notify() {} } });
  assert.equal(h.getActive().filter((n) => BROWSER_TOOL_NAMES.includes(n)).length, 7, "toggle -> visible");
  for (const name of CORE_TOOLS) assert.ok(h.getActive().includes(name), `${name} still visible`);
  // Re-applying gating (same module instance) preserves the command state.
  await sessionStartOf(h)({}, { ui: { notify() {} } });
  assert.equal(h.getActive().filter((n) => BROWSER_TOOL_NAMES.includes(n)).length, 7, "re-apply keeps command state");
  // A fresh module (extension reload) falls back to the CLI flag state.
  const h2 = makeHarness({ flag: undefined });
  const factory2 = await jitiFresh.import(EXTENSION_PATH, { default: true });
  factory2(h2.pi);
  await sessionStartOf(h2)({}, { ui: { notify() {} } });
  assert.equal(h2.getActive().filter((n) => BROWSER_TOOL_NAMES.includes(n)).length, 0, "fresh module -> hidden");
});
restoreSpawn();

// ---------------------------------------------------------------------------
// Part B: end-to-end with real AgentSession + faux provider (offline)
// ---------------------------------------------------------------------------
async function runE2E(flagEnabled) {
  const { ModelRuntime } = await jiti.import(join(PI_ROOT, "dist/core/model-runtime.js"));
  const { SettingsManager } = await jiti.import(join(PI_ROOT, "dist/core/settings-manager.js"));
  const { SessionManager } = await jiti.import(join(PI_ROOT, "dist/core/session-manager.js"));
  const { DefaultResourceLoader } = await jiti.import(join(PI_ROOT, "dist/core/resource-loader.js"));
  const { createAgentSessionServices, createAgentSessionFromServices } = await jiti.import(join(PI_ROOT, "dist/core/agent-session-services.js"));
  const fauxMod = await jiti.import(join(PI_ROOT, "node_modules/@earendil-works/pi-ai/dist/providers/faux.js"));

  const tmp = await import("node:fs/promises");
  const os = await import("node:os");
  const cwd = os.tmpdir();
  const agentDir = await tmp.mkdtemp(join(os.tmpdir(), "browser-disclosure-"));
  await tmp.mkdir(join(agentDir, "sessions"));
  await tmp.writeFile(join(agentDir, "models.json"), JSON.stringify({ providers: {} }));
  await tmp.writeFile(join(agentDir, "settings.json"), JSON.stringify({ defaultProvider: "faux", defaultModel: "faux/faux-1", defaultTools: CORE_TOOLS, compaction: { enabled: false } }));
  await tmp.writeFile(join(agentDir, "auth.json"), "{}");

  const faux = fauxMod.fauxProvider({ api: "faux", provider: "faux" });
  faux.setResponses([fauxMod.fauxAssistantMessage("done")]);
  const recorded = [];
  const wrappedProvider = {
    ...faux.provider,
    stream(model, context, options) {
      recorded.push((context.tools ?? []).map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })));
      return faux.provider.stream(model, context, options);
    },
    streamSimple(model, context, options) {
      recorded.push((context.tools ?? []).map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })));
      return faux.provider.streamSimple(model, context, options);
    },
  };
  const modelRuntime = await ModelRuntime.create({ authPath: join(agentDir, "auth.json"), modelsPath: join(agentDir, "models.json") });
  modelRuntime.registerNativeProvider(wrappedProvider);
  await modelRuntime.refresh({ allowNetwork: false });

  const settingsManager = SettingsManager.create(cwd, agentDir);
  const sessionManager = SessionManager.create(cwd, join(agentDir, "sessions"));
  const services = await createAgentSessionServices({
    cwd,
    agentDir,
    modelRuntime,
    settingsManager,
    resourceLoaderOptions: { additionalExtensionPaths: [EXTENSION_PATH] },
    extensionFlagValues: flagEnabled ? [["browser", true]] : [],
  });
  const { session } = await createAgentSessionFromServices({ services, sessionManager, model: modelRuntime.getModel("faux", "faux-1") });
  await session.bindExtensions({ mode: "print" });
  const active = session.getActiveToolNames().slice();
  await session.prompt("hello");
  await new Promise((r) => setTimeout(r, 1000));
  await tmp.rm(agentDir, { recursive: true, force: true });
  return { active, recorded };
}

await test("B11a: real runtime request — default state has no browser tools", async () => {
  const { active, recorded } = await runE2E(false);
  for (const name of BROWSER_TOOL_NAMES) assert.ok(!active.includes(name), `${name} not active`);
  for (const name of CORE_TOOLS) assert.ok(active.includes(name), `${name} active`);
  assert.ok(recorded.length >= 1, "at least one LLM request captured");
  for (const requestTools of recorded) {
    const names = requestTools.map((t) => t.name);
    for (const name of BROWSER_TOOL_NAMES) assert.ok(!names.includes(name), `${name} not in request`);
  }
});

await test("B11b: real runtime request — enabled state includes all 7 browser tools (runtime loads)", async () => {
  const { active, recorded } = await runE2E(true);
  for (const name of BROWSER_TOOL_NAMES) assert.ok(active.includes(name), `${name} active`);
  assert.ok(recorded.length >= 1, "at least one LLM request captured");
  for (const requestTools of recorded) {
    const names = requestTools.map((t) => t.name);
    for (const name of BROWSER_TOOL_NAMES) assert.ok(names.includes(name), `${name} in request`);
  }
});

await test("B12: measured request schema chars (default < enabled, delta exactly 7 tools)", async () => {
  const { recorded } = await runE2E(false);
  const { recorded: recordedEnabled } = await runE2E(true);
  const ser = (tools) => tools.map((t) => ({ type: "function", name: t.name, description: t.description, parameters: t.parameters, strict: false }));
  const serReal = (tools) => tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.parameters } }));
  const charsDefault = JSON.stringify(ser(recorded[0])).length;
  const charsEnabled = JSON.stringify(ser(recordedEnabled[0])).length;
  const charsRealDefault = JSON.stringify(serReal(recorded[0])).length;
  const charsRealEnabled = JSON.stringify(serReal(recordedEnabled[0])).length;
  const browserOnly = recordedEnabled[0].filter((t) => BROWSER_TOOL_NAMES.includes(t.name));
  const browserOnlyRealChars = JSON.stringify(serReal(browserOnly)).length;
  console.log(`MEASUREMENT DEFAULT_TOOL_COUNT=${recorded[0].length} DEFAULT_SCHEMA_CHARS=${charsDefault}`);
  console.log(`MEASUREMENT BROWSER_ENABLED_TOOL_COUNT=${recordedEnabled[0].length} BROWSER_ENABLED_SCHEMA_CHARS=${charsEnabled}`);
  console.log(`MEASUREMENT SCHEMA_REDUCTION_CHARS_PER_REQUEST=${charsEnabled - charsDefault}`);
  console.log(`MEASUREMENT REAL_FORMAT_DEFAULT_SCHEMA_CHARS=${charsRealDefault}`);
  console.log(`MEASUREMENT REAL_FORMAT_BROWSER_ENABLED_SCHEMA_CHARS=${charsRealEnabled}`);
  console.log(`MEASUREMENT REAL_FORMAT_REDUCTION_CHARS_PER_REQUEST=${charsRealEnabled - charsRealDefault}`);
  console.log(`MEASUREMENT BROWSER_GROUP_REAL_FORMAT_CHARS=${browserOnlyRealChars}`);
  assert.ok(charsDefault < charsEnabled, `default ${charsDefault} < enabled ${charsEnabled}`);
  assert.equal(recorded[0].length, recordedEnabled[0].length - 7, "delta is exactly 7 tools");
});

// ---------------------------------------------------------------------------
// Part C: regression checks
// ---------------------------------------------------------------------------
await test("C7/C8: other extensions and core files unchanged (browser wiring checksum frozen)", async () => {
  const snapshots = {
    "playwright-cdp-bridge.ts": "c125b4414ad5f0d5c9633db84f0ca4e8945bf5e66741b4918dcfdc2fa1a49868",
    "obsidian-mcp/index.ts": "9220b82c5b3a6773f97bf7aa24540ddff24a83afc21d12acc31df1c1461d7f23",
    "rtk.ts": "d278508809a5379e506384eabb19e17a672806c4eac7eabc1cd634699aea8c33",
    "slack-notify.ts": "8a7bc8159c2da60210dbfa43eb925b5a28c3a0d2c8f271ee51250bb2c8d6f3ac",
    "toolresult-minimize.ts": "cef7df4aca6f00911e924c977222a045d2374f7bb42f940b364fe6f9ec66088a",
  };
  const extRoot = __dirname;
  for (const [file, expected] of Object.entries(snapshots)) {
    const actual = createHash("sha256").update(readFileSync(join(extRoot, file))).digest("hex");
    assert.equal(actual, expected, `${file} checksum changed`);
  }
});

await test("C9: toggle and default->enabled->default cycles leave runtime intact", async () => {
  stubSpawn();
  const h = makeHarness();
  const factory = await loadFactory();
  factory(h.pi);
  const cmd = browserCommandOf(h);
  for (let i = 0; i < 3; i++) {
    await sessionStartOf(h)({}, { ui: { notify() {} } });
    await cmd.opts.handler(i % 2 ? "on" : "off", { ui: { notify() {} } });
  }
  await sessionStartOf(h)({}, { ui: { notify() {} } });
  assert.equal(h.getActive().filter((n) => BROWSER_TOOL_NAMES.includes(n)).length, 0, "back to hidden after cycles");
  for (const name of CORE_TOOLS) assert.ok(h.getActive().includes(name), `${name} still visible`);
  restoreSpawn();
});

await test("C10: extension reloads cleanly (no crash, no stale registrations)", async () => {
  stubSpawn();
  const h1 = makeHarness({ flag: true });
  const h2 = makeHarness({ flag: undefined });
  const factory = await loadFactory();
  factory(h1.pi);
  factory(h2.pi);
  await sessionStartOf(h1)({}, { ui: { notify() {} } });
  await sessionStartOf(h2)({}, { ui: { notify() {} } });
  assert.equal(h1.getActive().filter((n) => BROWSER_TOOL_NAMES.includes(n)).length, 7);
  assert.equal(h2.getActive().filter((n) => BROWSER_TOOL_NAMES.includes(n)).length, 0);
  restoreSpawn();
});

report();
