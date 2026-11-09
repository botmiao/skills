---
name: paseo-orchestrate
description: "Orchestrate multiple coding agents in Paseo by loading the paseo skill, matching roles to saved Agent Profiles via their 'When to use' (notes) field or explicit user selection, and running a 4-stage shared-workspace pipeline (contract & dispatch, parallel coding without build/test, unified build/unit-test/review, and multimodal integration/device testing). Use for /paseo-orchestrate, 'use paseo', or multi-agent Paseo workflows."
---
# Paseo multi-agent orchestration

Coordinate multiple coding agents in Paseo inside the **same workspace by default** using a conflict-free 4-stage pipeline.

## 1. Delegate Paseo mechanics to the `paseo` skill

1. Load and follow the `paseo` skill to inspect saved Agent Profiles, discover providers/models, launch sub-agents, wait for completion, and send follow-up prompts.
2. Do not create separate git worktrees unless the user explicitly asks for worktree or branch isolation. All sub-agents share the current workspace by default.

## 2. Match roles to Agent Profiles

Before launching sub-agents, inspect the saved Agent Profiles via the `paseo` skill and select each role's configuration in this priority order:

1. **User override first.** If the user explicitly names a profile, provider, or model for the whole task or for a specific role, honor that choice directly.
2. **Match by `When to use` (`notes`).** Compare each role's responsibility against every saved profile's `When to use` (`notes`) description and pick the closest match.
3. **Provider fallback.** If no saved profile matches a role, pick an appropriate available provider/model and tell the user which fallback was selected.

## 3. Default role topology

By default, structure multi-agent work around these roles:

| Role | Default owner | Core responsibility | Build / Test / Git permissions |
|---|---|---|---|
| **Main Agent (Orchestrator & Reviewer)** | Current agent | Decompose requirements, define shared interfaces/contracts, assign disjoint file boundaries, run unified compilation and unit tests, and perform default code review | Runs unified build & unit tests; owns final git state |
| **Backend Agent** *(spawn as needed)* | Paseo sub-agent matched to Backend `When to use` | Implement backend business logic and corresponding backend unit test files | **Write files only.** Do NOT run build, compile, test, or `git commit`. Return immediately when files are written |
| **Frontend Agent** *(spawn as needed)* | Paseo sub-agent matched to Frontend/UI `When to use` | Implement frontend/UI code and corresponding frontend unit test files | **Write files only.** Do NOT run build, compile, test, or `git commit`. Return immediately when files are written |
| **Independent Review Agent** *(optional)* | Paseo sub-agent matched to Review `When to use` (when user requests or when a dedicated cross-model review profile exists for non-trivial changes) | Perform read-only static review of `git diff` for logic bugs, security issues, and contract mismatches | **Read-only.** Do NOT edit files or run builds |
| **Integration & Device Test Agent** *(spawn as needed)* | Paseo sub-agent matched to Multimodal / E2E / QA `When to use` | Run integration tests, browser E2E flows, visual UI checks, or simulator/real-device verification after compilation and unit tests pass | May start dev/test servers and run integration/E2E suites; does not edit production code |

## 4. Four-stage execution pipeline

### Stage 1: Contract definition and shared foundation (Main Agent)
1. Identify any shared files that both backend and frontend depend on (shared types, schemas, OpenAPI/proto contracts, route constants, environment configs).
2. Either update those shared contract files directly in the Main Agent first, or complete them in a single sequential step before fanning out.
3. Partition writable file paths so no two parallel coding agents ever edit the same file.

### Stage 2: Parallel implementation and unit test authoring (Backend & Frontend Agents)
Launch the required coding agents concurrently in the shared workspace. Include these mandatory rules in every coding agent's prompt:
- **Objective & Contract:** State the exact interface contract and expected behavior.
- **Allowed Write Paths:** List the exact files or directories this agent may create or edit (including its unit test files). Forbid touching any file outside this list.
- **Write-Only Fast Return (No Compile / No Test):** Instruct the agent to write both the implementation code and the corresponding unit test files, then **return immediately**. Explicitly forbid running project builds, typechecks, test runners, linters, or `git commit` / `git checkout` / `git stash` so parallel agents never contend on build caches, database locks, or `.git/index.lock` or react to half-written files from peer agents.

### Stage 3: Unified build, unit testing, and code review (Main Agent + optional Review Agent)
Once all coding agents finish and return:
1. **Unified compile and unit test run:** The Main Agent runs the project's compilation, typecheck, linter, and unit test suite once across the workspace.
2. **Code review:**
   - By default, the Main Agent reviews `git diff` against the Stage 1 contract, checking for logic flaws, edge cases, and boundary violations.
   - If a dedicated Review Profile (especially a different model family) is configured in Paseo and the change is non-trivial, or if the user requested an independent reviewer, launch the **Independent Review Agent** in read-only mode in parallel with the unified build/test run.
3. **Targeted rework loop:** If compilation fails, unit tests fail, or review uncovers defects, the Main Agent summarizes the exact file, line, and failure reason and sends a follow-up prompt to the responsible Backend or Frontend Agent to fix the code (still without running builds in parallel), then re-runs unified verification.

### Stage 4: Multimodal integration and device testing (Integration & Device Test Agent, as needed)
When the task involves end-to-end flows, UI rendering, browser interactions, or mobile/desktop simulator or device verification, and **only after Stage 3 compilation and unit tests pass**:
1. Launch the **Integration & Device Test Agent** using a profile suited for multimodal vision and browser/device tool execution.
2. Have it start or connect to the application environment, execute integration/E2E test flows, inspect visual rendering and console/network logs, and return a structured pass/fail report with reproduction steps for any failure.
3. If integration or device testing reveals issues, the Main Agent routes fixes back to the corresponding coding agent and re-verifies through Stage 3 and Stage 4.

## 5. Final summary report

When all active stages pass, report to the user:
1. **Role-to-Profile mapping:** Which Paseo profile (`provider/model` and matched `When to use` note) handled each role.
2. **Changes by role:** Files created or modified by Backend, Frontend, and Main Agent.
3. **Verification & review results:** Unified build/unit-test status, review findings resolved, and integration/device test outcomes.
