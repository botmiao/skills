---
name: t3code-orchestrate
description: "Orchestrate multi-agent workflows in T3Code across three progressive tiers: Tier 1 shared-workspace 4-stage pipeline via delegate_task (default), Tier 2 isolated Git worktree orchestration via t3_thread_launch for large refactors, and Tier 3 cross-device Linked Environments orchestration across Windows, macOS, and Linux via t3_environment_links and explicit Git branch sync. Use for /t3code-orchestrate, $t3code-orchestrate, 'use t3code to orchestrate', or multi-agent T3Code tasks."
---
# T3Code multi-agent orchestration

Coordinate multiple coding agents in T3Code using the built-in `t3-code` Orchestrator V2 MCP tools (`mcp__t3-code__*`, plus `t3-code-direct.t3_thread_wait` on Codex). Start in the **current workspace by default (Tier 1)**, escalate to **Git worktrees for large-scale or overlapping changes (Tier 2)**, and escalate to **Linked Environments for cross-OS workflows spanning Windows, macOS, and Linux (Tier 3)**.

## 1. Invocation, capability discovery, and optional `init`

Trigger via `/t3code-orchestrate <task>`, `$t3code-orchestrate <task>` (Codex skill picker), or natural-language multi-agent requests. No upfront setup or manual agent naming is required.

### Optional `/t3code-orchestrate init` (save default role routing)
When invoked as `/t3code-orchestrate init` (or `$t3code-orchestrate init`):
1. Call `orchestrator_capabilities` to list connected `providerInstances` and `models`.
2. Call `t3_environment_links` (if available) to list linked machines (`environmentId`, `label`, `status`, `access`).
3. Present a concise summary of available providers, models, and machines, ask the user once for their preferred defaults per role (`Backend`, `Frontend`, `Reviewer`, `Tester`, plus OS target hosts if linked), and write a `## T3Code team routing` markdown table to either `~/.agents/t3code-team.md` (user-wide) or the repository's `AGENTS.md` (project-scoped), per user choice. Stop after saving.

### Role-to-provider/model resolution on normal runs
Before dispatching workers:
1. If the `in-your-own-words` skill is available, state the user's goal, problem, and expected deliverables concisely. If the codebase area is unfamiliar and the `how` skill is available, inspect affected entry points and test commands before partitioning work.
2. Call `orchestrator_capabilities` once to inspect the parent's inherited provider/model, permission ceilings (`runtimeMode`, `interactionMode`), and available `providerInstances` and `models`.
3. Select each role's `target` (`providerInstanceId`, `driverKind`, `model`, and `environmentId` when cross-device) in this priority order:
   - **Explicit user override first.** Honor any provider, model, tier, or target machine named in the prompt.
   - **Saved routing table second.** Check the repository's `AGENTS.md` and `~/.agents/t3code-team.md` (if present) for a `T3Code team routing` table and apply matching role preferences that are currently available.
   - **Capability-based auto-selection third.** Pick strong coding models for `Backend` and `Frontend` (or inherit the parent), prefer a **different provider/model family** for `Independent Review Agent` when multiple providers (such as Claude and Codex) are available, and select a multimodal/browser/device-capable model on the target OS for `Integration & Device Test Agent`. Tell the user which mapping was chosen.

## 2. Select the execution tier (auto-detect + explicit override)

Honor explicit user cues first (`"在当前工作区"` / `--tier 1`, `"用 worktree"` / `--worktree` / `--tier 2`, `"跨设备"` / `"Windows 和 Mac"` / `--cross-device` / `--tier 3`). When unspecified, auto-select using this matrix and state the chosen tier in one line before launching workers:

| Tier | When to select | T3Code dispatch primitive | Isolation & Git model |
|---|---|---|---|
| **Tier 1: Shared Workspace** *(default)* | Module boundaries are clean, writable file paths are disjoint, and the current host can run all required builds and tests | `delegate_task` (`mode: "async"`) in current checkout | Shared checkout; disjoint `Allowed Write Paths`; workers write files only |
| **Tier 2: Worktree Isolation** | Large-scale cross-cutting refactors, overlapping edits to shared core files, workers needing iterative local compile/test loops, or competing A/B spikes | `t3_thread_launch` with `workspaceStrategy: { type: "worktree", baseRef, startFromOrigin }` (or `delegate_task` worktree mode if advertised) | Dedicated Git worktree and branch per worker; sequential diff review and merge-back |
| **Tier 3: Cross-Device Linked Environments** | Workloads require OS-specific SDKs, compilers, signing, browsers, or simulators across **Windows**, **macOS**, and **Linux** (can combine with Tier 2 remote worktrees) | `t3_environment_links` + `delegate_task` or `t3_thread_launch` with explicit `environmentId` | Separate host filesystems synchronized over an explicit Git working branch (`git push` / `git fetch`) |

## 3. Default role topology

Spawn only the roles required by the task. Generate descriptive child titles automatically (`[Backend] <slice>`, `[Frontend] <slice>`, `[Review] <scope>`, `[Test] <flow>`):

| Role | Default owner | Core responsibility | Tier 1 permissions | Tier 2 / Tier 3 permissions |
|---|---|---|---|---|
| **Main Agent (Orchestrator & Reviewer)** | Current T3Code thread | Define Stage 1 contracts, partition work, run unified verification, review diffs, merge branches, own final git state | Runs unified build & unit tests; owns git | Commits Stage 1 base ref, merges worker/platform branches, runs final gates |
| **Backend Agent** *(as needed)* | Child matched to Backend coding target | Implement backend logic and backend unit tests | **Write files only.** No build, compile, test, lint, or `git commit` | May compile, run unit tests, and commit inside its assigned worktree or OS sync branch |
| **Frontend Agent** *(as needed)* | Child matched to Frontend/UI coding target | Implement UI components/state and frontend unit tests | **Write files only.** No build, compile, test, lint, or `git commit` | May compile, run unit tests, and commit inside its assigned worktree or OS sync branch |
| **Independent Review Agent** *(optional)* | Cross-provider `delegate_task` (`role: "review"`, `interactionMode: "plan"`) | Static read-only audit of diffs for logic bugs, security flaws, and contract drift | **Read-only.** Never edit files or run mutating commands | **Read-only.** Audits branch or cross-platform diffs |
| **Integration & Device Test Agent** *(as needed)* | Child (`role: "test"`) or Main Agent with `preview_*` / `device_*` | Execute browser E2E, visual checks, or simulator/native OS verification after unit tests pass | May run dev servers, `preview_*`, `device_*`, and E2E suites; no production code edits | Runs native OS builds, `preview_*`, iOS/Android simulators (`device_*`), or desktop UI checks on target host |

## 4. Tier 1 playbook: Shared-workspace 4-stage pipeline (default)

Apply the `principle-separate-before-serializing-shared-state` and `principle-prove-it-works` skills when available.

### Stage 1: Contract definition and disjoint path partitioning (Main Agent)
1. Identify shared files both backend and frontend depend on (types, schemas, OpenAPI/proto contracts, route constants, env configs).
2. Update those shared contract files directly in the Main Agent before fanning out.
3. Partition writable file paths so no two concurrent coding children ever touch the same file.

### Stage 2: Parallel write-only implementation (`delegate_task`)
Launch coding children concurrently with `delegate_task`:
- Pass `role: "implementation"`, `mode: "async"`, a unique `clientRequestId` per worker, and `runtimeMode` no broader than the parent's ceiling.
- If mixing provider-native subagents with `delegate_task`, call `delegate_task(mode: "async")` in its own tool batch first so foreground native calls do not delay MCP dispatch.
- Because T3Code does **not** copy parent conversation history into `delegate_task` children, every `task` prompt must be self-contained and state:
  1. **Objective & Stage 1 Contract:** Exact types, interfaces, file imports, and expected behavior.
  2. **Allowed Write Paths:** Exact files or directories this worker may create or edit (including its unit test files). Forbid editing anything outside this list.
  3. **Write-Only Fast Return (No Compile / No Test / No Git):** Instruct the child to write implementation and unit test files and **return immediately**. Explicitly forbid project builds, typechecks, test runners, linters, and `git commit` / `git checkout` / `git stash` to prevent lock contention and half-written peer file failures.
- Wait for completion via parent wakeup or `task_status` / `t3_thread_wait`. If a child surfaces `hasPendingQuestion: true`, inspect and answer via `t3_pending_request` (`threadId: childThreadId`) or escalate genuine product choices to the user.

### Stage 3: Unified build, unit testing, and code review
1. **Unified verification:** The Main Agent runs compilation, typecheck, linter, and unit tests once across the workspace.
2. **Code review:**
   - The Main Agent reviews `git diff` against the Stage 1 contract for logic errors, edge cases, and path-boundary violations.
   - When the change is non-trivial and a second provider/model family is available (or when requested by the user), launch an **Independent Review Agent** in parallel via `delegate_task` (`role: "review"`, `interactionMode: "plan"`). In T3Code, every new independent review or re-check round must use a **fresh `delegate_task` call** (with prior findings summarized in the brief), never `t3_thread_send`.
3. **Targeted rework loop:**
   - Fix trivial one-line nits directly in the Main Agent.
   - For substantive compile/test failures or review defects, send exact file, line, and failure details back to the responsible coding child via `t3_thread_send` (`threadId: childThreadId`, `mode: "auto"`) followed by `t3_thread_wait`, keeping write-only rules while peers are active, then re-run unified Stage 3 checks.

### Stage 4: Collaborative browser preview and device verification (as needed)
When the task affects UI rendering, browser flows, or device behavior, and **only after Stage 3 passes**:
1. Use T3Code's built-in `preview_*` tools (`preview_open`, `preview_navigate`, `preview_wait_for`) or `device_*` tools (`device_open`, `device_close`), or delegate to an **Integration & Device Test Agent** (`delegate_task` with `role: "test"`).
2. Verify end-to-end interactions, visual layout, and console/network logs, returning a pass/fail report with reproduction steps.
3. Route any failures back through the responsible coding child and re-verify Stage 3 and Stage 4.

## 5. Tier 2 playbook: Worktree-isolated orchestration (large-scale changes)

Use Tier 2 when parallel workers must edit overlapping core files, run iterative compilers/tests independently, or evaluate competing designs.

1. **Pre-flight & Stage 1 commit:**
   - Confirm the project root is a valid Git repository (`git rev-parse --is-inside-work-tree`); `t3_thread_launch` worktree provisioning fails on non-git parent folders.
   - Land any Stage 1 shared contracts first and commit them to a clean base branch (`<baseRef>`) so every worktree branches from an identical foundation.
2. **Launch worktree-bound workers:**
   - T3Code binds a thread's workspace *before* the agent starts; running `git worktree add` inside a prompt does not update T3Code's workspace binding.
   - If `orchestrator_capabilities` / `delegate_task` advertises `workspaceStrategy`, use `delegate_task` with `workspaceStrategy: { type: "worktree", baseRef: "<baseRef>", startFromOrigin: false }`.
   - Otherwise launch each isolated worker via `t3_thread_launch` with:
     - Explicit `projectId` (matching the current project)
     - `workspaceStrategy: { type: "worktree", baseRef: "<baseRef>", startFromOrigin: false }` (use `startFromOrigin: true` only when branching directly from `origin/<default-branch>`)
     - `title`, `target` (`providerInstanceId`, `model`), `clientRequestId`, and a self-contained `message` brief.
   - If a `t3_thread_launch` response is lost or times out, inspect `t3_thread_list` before retrying to avoid duplicate worktrees.
3. **Worker execution rules:**
   - Each worker edits, compiles, and runs unit tests freely inside its isolated worktree, then commits cleanly to its worktree branch. Forbid pushing to `main` or modifying sibling worktrees.
4. **Monitor, review, and merge back:**
   - Wait on each worker thread with `t3_thread_wait` and read summaries via `t3_thread_read`. Use `t3_thread_send` for rework inside the same worktree thread.
   - For A/B spikes, compare benchmark outputs and `git diff <baseRef>...<worker-branch>` across candidates and pick the winner.
   - For partitioned refactors, merge or cherry-pick each verified worker branch sequentially into the integration branch, resolve cross-slice touchpoints, and run unified Stage 3 (full build/test + optional cross-model `delegate_task` review) and Stage 4 verification.

## 6. Tier 3 playbook: Cross-device Linked Environments (Windows / macOS / Linux)

Use Tier 3 when work spans OS-specific toolchains (such as Windows `.NET` / MSVC / Win32 / PowerShell alongside macOS Xcode / Swift / Cocoa / iOS Simulator / `codesign`, or Linux container/GPU hosts).

1. **Discover and verify Linked Environments:**
   - Call `t3_environment_links` first. Thread context does not automatically report which machine it runs on or whether peers are online.
   - Check `links[]` for each required OS machine's `environmentId`, `label`, `status` (`"reachable"`), and `access`.
   - If Linked Environments is disabled or a required Windows/macOS/Linux host is missing or `"unreachable"`, call `t3_environment_link` to post an interactive approval card (or instruct the user to enable **Settings -> Labs -> Linked environments** on both hosts and pair under **Settings -> Environments -> Linked environments**). Never silently run OS-specific builds or tests on the wrong OS.
2. **Synchronize code via an explicit Git working branch:**
   - Linked Environments route MCP calls across hosts; they do **not** share uncommitted local filesystem edits.
   - In Stage 1, commit shared contracts or cross-platform changes to a dedicated sync branch (for example, `feat/<slug>` or `t3-sync/<slug>`) and push to `origin` (`git push -u origin <sync-branch>`). Record the exact commit SHA.
3. **Dispatch OS-specific workers with explicit `environmentId`:**
   - **Standard cross-machine subtask:** Call `delegate_task` with `target: { environmentId: "<remote-env-id>", providerInstanceId, model }` (and `target.projectId` if needed). T3Code's `RemoteDelegation` tracks the remote run across restarts and wakes the parent thread upon completion.
   - **Remote worktree isolation (Tier 3 + Tier 2):** When the remote host has dirty state or runs multiple concurrent tasks, call `t3_thread_launch` with `environmentId: "<remote-env-id>"`, explicit `projectId`, and `workspaceStrategy: { type: "worktree", baseRef: "origin/<sync-branch>", startFromOrigin: true }`.
   - Every remote brief must state: (a) the exact Git remote, `<sync-branch>`, and expected base commit SHA (`git fetch origin && git checkout <sync-branch>` when not using a fresh `startFromOrigin` worktree), (b) the OS-specific files/modules to implement or verify, (c) the exact native build/test/simulator commands to run, and (d) instructions to commit and push OS-specific code fixes to `<sync-branch>-<os>` (or `<sync-branch>` when serialized) and report the resulting commit SHA.
4. **Explicit `environmentId` on all follow-ups:**
   - Omitting `environmentId` on thread tools silently targets only the local host. Always pass `environmentId: "<remote-env-id>"` explicitly on `t3_thread_read`, `t3_thread_send`, `t3_thread_wait`, `t3_thread_list`, and `t3_pending_request`.
   - Reference remote threads using their full `t3-thread://v2/<environmentId>/<threadId>` URI so links open the right machine in the T3Code UI.
5. **Cross-platform convergence:**
   - Once Windows, macOS, and Linux workers finish, run `git fetch origin` on the primary workspace, merge any platform branches (`<sync-branch>-win`, `<sync-branch>-mac`), resolve shared interface adjustments, and trigger a final fast verification pass on each affected OS environment if shared files changed after merge.

## 7. Final summary report

If the `no-comments` and `unslop` skills are available, apply them before presenting the final report. Include:
1. **Execution tier & topology:** Selected tier (`Tier 1`, `Tier 2`, or `Tier 3`) and why it was chosen.
2. **Role-to-target mapping:** Each active role, its host environment (`local` or linked `label` / `environmentId`), `provider/model`, and thread URI (`t3-thread://v2/...` when applicable).
3. **Changes & branches:** Files modified per role (plus worktree or cross-device sync branches merged and final commit SHAs).
4. **Verification & review results:** Unified build/unit-test outputs, independent review findings resolved, and browser preview / native OS / device test outcomes.
