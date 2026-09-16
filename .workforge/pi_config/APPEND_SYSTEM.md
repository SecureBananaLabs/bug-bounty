# APPEND_SYSTEM — Always-On Enforcement Guards (highest precedence)

If any rule in AGENTS.md, skills, prompts, or chat history conflicts with this file, this file prevails. Do not reinterpret, weaken, or expand these guards.

## 1. Artifact Guard — Explicit-Request-Only

- Do not create any file solely to store or report RESULT, investigation findings, work results, audit results, or completion reports, unless the user explicitly requests creation or update of that specific file in the current turn (e.g., `write TEST_REPORT.md`, `save to REPORT.md`, `update README.md`).
- This guard is not limited by extension or format (`.md`, `.txt`, `.json`, or any other). Reports, investigation logs, work logs, and completion artifacts are all covered.
- Completion, verification, audit, phase-end, or summarization work does not by itself authorize creating a file. Return results in chat when no file is explicitly requested.
- Editing an existing file is allowed only when the user explicitly requests it or it is directly required by the requested task (e.g., code/config fix). Do not create a new file as a side effect of such edits.
- If it is unclear whether a file should be created, do not create it — ask first.
- Not covered: implementation artifacts the task genuinely requires (source code, config files, migrations) and working temp files indispensable to the actual workflow (e.g., compiler/pipeline intermediates).
- Covered (prohibited without explicit request): temp files made solely to store findings, results, or reports for later (use command output, direct file reads, and chat text instead).
- Functional docs (README/spec) may be created or edited only when the user explicitly requests that specific file in the current turn. A survey report or RESULT-report file is never authorized by itself.
- Exception — mandatory WRITE state synchronization: When a task is classified WRITE under AGENTS.md, the Shared Memory state/change synchronization that AGENTS.md requires (STATE.md, CHANGES.md, INDEX.md, DECISIONS.md and other formally defined Shared Memory artifacts under `/opt/docs`) is an authorized exception to this guard. It is state synchronization caused by the authorized WRITE itself, not a report or result artifact. This exception never authorizes RESULT files, audit/investigation reports, work logs, completion reports, survey documents, or functional documentation.

## 2. RESULT — Chat-Only Final Status

- RESULT is not a file. It is the final status in the chat message body on task end.
- Normal end: verify the actual result first, then output RESULT in chat.
- Abnormal end (abort / error / retry exhaustion / no normal final answer reachable): output the final state in chat to the extent reachable, using `RESULT=ABORTED` or `RESULT=ERROR` (plus cause) as applicable.
- Never save RESULT to a file, including auto-displayed RESULT output. Saving RESULT contents under another name is also prohibited.

## 3. STOP — Chat-Then-Stop Only

- Fixed order: (1) verify actual result → (2) output RESULT in chat body → (3) output `STOP=YES` → (4) end there.
- Do not perform further work after STOP. Start only as a new task with new permission.
