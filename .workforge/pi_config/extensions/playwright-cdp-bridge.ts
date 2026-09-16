/**
 * Pi Playwright MCP CDP Bridge — production Chrome @ 127.0.0.1:9222
 * Minimal bridge: spawns Playwright MCP with fixed CDP endpoint, forwards tools.
 * Constraints: no --isolated/--headless, no --user-data-dir, no profile change.
 * Pillars: SESSION_PERSISTED / SESSION_EXPIRED / HUMAN_AUTH_REQUIRED / PROFILE_NOT_FOUND distinguished (refs crowdworks_browser.py)
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { spawn, ChildProcess } from "node:child_process";
import { existsSync as _existsSync } from "node:fs";
import { Type } from "typebox";

const MCP_CLI_POSIX = "/home/deploy/playwright-mcp/node_modules/@playwright/mcp/cli.js";
const MCP_CLI = (() => {
  if (process.platform === "win32") {
    try { if (_existsSync(MCP_CLI_POSIX)) return MCP_CLI_POSIX; } catch {}
    return "";
  }
  return MCP_CLI_POSIX;
})();
const CDP_ENDPOINT = "http://127.0.0.1:9222";

// ---------------------------------------------------------------------------
// Tool disclosure (LLM-visible tool schema) control.
//
// The 7 browser_* tools below are registered unconditionally (their
// implementation and execution capability are unchanged), but they are only
// disclosed to the LLM when browser access is explicitly needed:
//   - default: hidden (not included in LLM tool definitions / requests)
//   - enabled: visible (included in LLM tool definitions / requests)
//
// Activation uses existing Pi mechanisms only:
//   - CLI flag:    pi --browser
//   - TUI command: /browser [on|off]   (mid-session toggle)
// The Playwright MCP runtime is only started while disclosure is enabled.
// Disclosure state is session/agent scoped; the CDP endpoint and browser
// session handling are unchanged.
// ---------------------------------------------------------------------------
const BROWSER_TOOL_NAMES = [
  "browser_tabs",
  "browser_navigate",
  "browser_snapshot",
  "browser_click",
  "browser_type",
  "browser_take_screenshot",
  "browser_close",
];
// Mid-session toggle state (module scope). Survives until extension reload;
// on reload the CLI flag state applies again.
let browserDisclosureEnabled = false;
function isBrowserDisclosureEnabled(pi: any) {
  return browserDisclosureEnabled || pi.getFlag("browser") === true;
}
function applyBrowserDisclosure(pi: any, enabled: boolean) {
  const active = pi.getActiveTools();
  const next = enabled
    ? Array.from(new Set(active.concat(BROWSER_TOOL_NAMES)))
    : active.filter(function(name: string) { return BROWSER_TOOL_NAMES.indexOf(name) === -1; });
  const changed = next.length !== active.length || next.some(function(name: string, i: number) { return name !== active[i]; });
  if (changed) {
    pi.setActiveTools(next);
  }
}

// Session states — must match /opt/workforge/workforge/crowdworks_browser.py (reference only, not mutated)
const SESSION_PERSISTED = "SESSION_PERSISTED";
const SESSION_EXPIRED = "SESSION_EXPIRED";
const HUMAN_AUTH_REQUIRED = "HUMAN_AUTH_REQUIRED";
const PROFILE_NOT_FOUND = "PROFILE_NOT_FOUND";

type Pending = { resolve:(v:any)=>void; reject:(e:any)=>void; timer:NodeJS.Timeout };

export default function(pi: ExtensionAPI){
  let proc: ChildProcess | null = null;
  let buf = "";
  let nextId = 1;
  let ready = false;
  const pending = new Map<number,Pending>();
  let mcpTools: any[] = [];

  pi.registerFlag("browser", {
    description: "Disclose browser tools (browser_tabs, browser_navigate, browser_snapshot, browser_click, browser_type, browser_take_screenshot, browser_close) to the LLM and start the Playwright MCP bridge",
    type: "boolean",
  });
  pi.registerCommand("browser", {
    description: "Toggle browser tool disclosure to the LLM (usage: /browser [on|off])",
    async handler(args: string, ctx: any) {
      const arg = args.trim().toLowerCase();
      browserDisclosureEnabled = arg === "on" ? true : arg === "off" ? false : !browserDisclosureEnabled;
      const enabled = isBrowserDisclosureEnabled(pi);
      try {
        applyBrowserDisclosure(pi, enabled);
        if (enabled) {
          if (!ready) await startMcp();
        } else {
          stopMcp();
        }
      } catch (err) {
        ctx.ui.notify("browser disclosure failed: "+(err instanceof Error ? err.message : String(err)), "error");
        return;
      }
      ctx.ui.notify("Browser tools "+(enabled ? "visible to LLM" : "hidden from LLM"), "info");
    },
  });

  function send(req:any){
    if(!proc || !proc.stdin || proc.stdin.destroyed) throw new Error("MCP not running");
    proc.stdin.write(JSON.stringify(req)+"\n");
  }
  function callMcp(method:string, params:any={}):Promise<any>{
    return new Promise((resolve,reject)=>{
      const id = nextId++;
      const timer = setTimeout(()=>{ pending.delete(id); reject(new Error("MCP timeout "+method)); }, 30000);
      pending.set(id,{resolve,reject,timer});
      send({jsonrpc:"2.0",id,method,params});
    });
  }

  function onData(chunk:Buffer){
    buf += chunk.toString();
    let idx;
    while((idx=buf.indexOf("\n"))>=0){
      const line = buf.slice(0,idx).trim();
      buf = buf.slice(idx+1);
      if(!line) continue;
      let msg:any;
      try{ msg = JSON.parse(line); }catch{ console.error("[bridge] non-JSON:",line.slice(0,500)); continue; }
      if(msg.id !== undefined && pending.has(msg.id)){
        const p = pending.get(msg.id)!; pending.delete(msg.id); clearTimeout(p.timer);
        if(msg.error) p.reject(new Error(JSON.stringify(msg.error)));
        else p.resolve(msg.result);
      }
    }
  }

  async function startMcp(){
    if(!MCP_CLI){ console.warn("[bridge] MCP CLI not available on this platform — skipping"); return; }
    if(proc) return;
    proc = spawn("node", [MCP_CLI, "--cdp-endpoint", CDP_ENDPOINT], { stdio:["pipe","pipe","pipe"] });
    proc.stdout!.on("data", onData);
    proc.stderr!.on("data", (d:Buffer)=>{ console.error("[mcp:stderr]", d.toString().slice(0,1000)); });
    proc.on("exit", (code,signal)=>{
      console.error("[bridge] MCP exited code="+code+" signal="+signal);
      for(const [,p] of pending){ clearTimeout(p.timer); p.reject(new Error("MCP exited")); }
      pending.clear();
      proc=null; ready=false;
    });
    proc.on("error", (e)=>{ console.error("[bridge] spawn error",e); });
    await callMcp("initialize", { protocolVersion:"2024-11-05", capabilities:{}, clientInfo:{name:"pi-bridge",version:"1.0"} });
    send({jsonrpc:"2.0", method:"notifications/initialized"});
    const list = await callMcp("tools/list", {});
    mcpTools = list.tools ?? [];
    ready = true;
    console.log("Playwright MCP ready");
    console.log("Registered browser_* tools: "+mcpTools.map((t:any)=>t.name).join(", "));
    try{ (pi as any).ui?.notify?.("Playwright MCP ready ("+mcpTools.length+" tools)", "info"); }catch{}
  }

  function stopMcp(){
    for(const [,p] of pending){ clearTimeout(p.timer); p.reject(new Error("shutdown")); }
    pending.clear();
    if(proc){
      try{ proc.kill("SIGTERM"); }catch{}
      setTimeout(()=>{ try{ proc?.kill("SIGKILL"); }catch{} }, 3000);
      proc=null;
    }
    ready=false;
  }

  async function callTool(name:string, args:any){
    if(!ready || !proc) throw new Error("MCP not ready — bridge not initialized (MCP process not running or CDP unreachable at "+CDP_ENDPOINT+")");
    const res = await callMcp("tools/call", { name, arguments: args ?? {} });
    return res;
  }

  function toText(res:any):string{
    if(!res) return "";
    if(Array.isArray(res.content)) return res.content.map((c:any)=>c.text ?? JSON.stringify(c)).join("\n");
    return JSON.stringify(res,null,2);
  }

  pi.on("session_start", async (_e, ctx)=>{
    const enabled = isBrowserDisclosureEnabled(pi);
    try{
      applyBrowserDisclosure(pi, enabled);
      if(enabled){
        ctx.ui.notify("Playwright CDP bridge connecting to "+CDP_ENDPOINT, "info");
        await startMcp();
        ctx.ui.notify("Playwright MCP ready — "+mcpTools.length+" tools", "info");
      } else {
        ctx.ui.notify("Browser tools hidden from LLM (enable with --browser or /browser on)", "info");
      }
    }catch(e:any){
      ctx.ui.notify("browser disclosure failed: "+(e?.message??String(e)), "error");
      console.error("[bridge] session_start disclosure failed", e);
    }
  });

  pi.on("session_shutdown", async ()=>{
    stopMcp();
  });

  function reg(name:string, description:string, schema:any){
    pi.registerTool({
      name, label: name, description, parameters: schema,
      async execute(_id:string, params:any){
        const raw = await callTool(name, params);
        const text = toText(raw);
        const isErr = (raw as any)?.isError === true;
        return { content:[{type:"text", text}], details: raw, isError: isErr } as any;
      }
    });
  }

  reg("browser_tabs", "List/manage browser tabs (CDP attach)", Type.Object({ action: Type.String({description:"list|new|close|select"}), index: Type.Optional(Type.Number()), url: Type.Optional(Type.String()) }));
  reg("browser_navigate", "Navigate page to URL", Type.Object({ url: Type.String() }));
  reg("browser_snapshot", "Capture accessibility snapshot", Type.Object({ target: Type.Optional(Type.String()), filename: Type.Optional(Type.String()), depth: Type.Optional(Type.Number()), boxes: Type.Optional(Type.Boolean()) }));
  reg("browser_click", "Click element by snapshot ref", Type.Object({ target: Type.String(), element: Type.Optional(Type.String()), doubleClick: Type.Optional(Type.Boolean()), button: Type.Optional(Type.String()), modifiers: Type.Optional(Type.Array(Type.String())) }));
  reg("browser_type", "Type text into element", Type.Object({ target: Type.String(), text: Type.String(), element: Type.Optional(Type.String()), submit: Type.Optional(Type.Boolean()), slowly: Type.Optional(Type.Boolean()) }));
  reg("browser_take_screenshot", "Take screenshot", Type.Object({ target: Type.Optional(Type.String()), element: Type.Optional(Type.String()), type: Type.Optional(Type.String()), filename: Type.Optional(Type.String()), fullPage: Type.Optional(Type.Boolean()) }));
  reg("browser_close", "Close the page", Type.Object({}));

  void SESSION_PERSISTED; void SESSION_EXPIRED; void HUMAN_AUTH_REQUIRED; void PROFILE_NOT_FOUND;
}
