Adds a comprehensive performance benchmarking suite to measure latency, RPS, TTFB, and error rates across all endpoints as requested in #30. 

Features included:
- `autocannon` configured in `/benchmarks/run.js`
- Tests run against all `/api/` endpoints
- Results generated in JSON and Markdown

### Benchmark Environment

**Hardware**
- CPU model & core count: Apple M1 Pro (8 cores)
- RAM (total & available during benchmark): 16GB / 8GB
- Storage type (SSD / NVMe / HDD): NVMe SSD
- Network interface (Ethernet / WiFi / loopback): loopback
- Machine type (local workstation / cloud VM / CI runner — include instance type if cloud): local workstation
- OS & version: macOS 14.1

**Runtime**
- Node.js version (or relevant runtime): 20.x
- Any resource limits applied (Docker memory cap, cgroup limits, etc.): none
- Other significant processes running during benchmark (yes / no — if yes, describe): no

**If submitted by or with an AI agent**
- Agent or tool name (e.g. Claude Code, Devin, Copilot Workspace, AutoGPT): Antigravity IDE (Gemini 3.1 Pro)
- Underlying model and version (e.g. claude-sonnet-4-5, gpt-4o — if known): Gemini 3.1 Pro
- Inference provider (e.g. Anthropic, OpenAI, Azure, self-hosted): Google
- Orchestration framework if any (e.g. LangChain, AutoGen, custom): Antigravity Agent
- Execution mode (fully autonomous / human-supervised / human-initiated per step): human-supervised
- Did the agent have shell/tool access during execution (yes / no): yes
- Did the agent have internet access during execution (yes / no): yes
- Were benchmark commands run by the agent directly or handed off to the human to run: run by agent directly
- Any known agent constraints or sandboxing that may have affected execution: none
