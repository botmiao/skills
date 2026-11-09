---
name: agy-teamwork
description: "Orchestrate complex, multi-step tasks in Antigravity using the teamwork sentinel and self/research subagents with structured milestone contracts, shared-workspace file isolation, and runnable verification gates. Use for /agy-teamwork, 'use teamwork', or Antigravity multi-agent orchestration."
---
# Antigravity teamwork orchestration

Coordinate multi-agent execution in a pure Antigravity environment using the `teamwork` project sentinel (`invoke_subagent(TypeName="teamwork")`) and `self` / `research` subagents.

## 1. Frame the goal and inspect context

1. If the `in-your-own-words` skill is available, apply it at the start of the task to state the user's goal, the problem being solved, and the expected deliverables.
2. If the codebase architecture around the task is unfamiliar and the `how` skill is available, use the `how` skill (or spawn read-only `research` subagents via `invoke_subagent`) to identify the affected modules, entry points, and test commands before locking in a multi-agent plan.

## 2. Build the Milestone Contract

In Antigravity, the `teamwork` subagent (`user_liaison` role) is an ultra-light project sentinel: it records user requests, reports progress via cron, and starts or restarts underlying orchestrators, but it does **not** write code or make technical decisions itself. Never pass a vague request to `teamwork`.

Before invoking `teamwork`, write a structured **Milestone Contract** containing:

1. **Ordered Milestones (`M1`, `M2`, ...):**
   Apply the `principle-sequence-verifiable-units` skill if available. Break the project into small, sequential or dependency-ordered milestones where shared types, schemas, and foundational scaffolding land in `M1` before parallel feature slices fan out.
2. **Same-Workspace File Isolation (`Workspace: "inherit"`):**
   In Antigravity, every subagent (`teamwork`, `self`, `research`) runs with `Workspace: "inherit"` and `Model: "inherit"` in the same filesystem checkout. To prevent parallel `self` workers from overwriting each other, apply the `principle-separate-before-serializing-shared-state` skill if available:
   - Assign read-only exploration and auditing to `TypeName: "research"`.
   - Assign code writing to `TypeName: "self"`, giving each concurrent worker strictly disjoint `Allowed Write Paths` and forbidding edits outside those paths.
   - Serialize any two tasks that must modify the same file.
   - Instruct subagents never to run `git checkout`, `git reset`, or `git rebase` while sibling subagents are active in the workspace.
3. **Falsifiable Verification Gate per Milestone:**
   Apply the `principle-prove-it-works` skill if available. Every milestone must name the exact terminal command(s) to execute and the pass output required before the orchestrator advances to the next milestone.
4. **Escalation Boundary:**
   Define what the orchestrator should resolve autonomously (compile errors, test failures, lint fixes) versus what requires pausing to ask the user (irreversible actions, destructive data operations, or genuine product preference calls).

## 3. Launch and manage `teamwork`

1. **Invoke `teamwork`:**
   Call `invoke_subagent` with:
   - `TypeName: "teamwork"`
   - `Role: "Project Sentinel"`
   - `Workspace: "inherit"`
   - `Model: "inherit"`
   - `Prompt`: paste the full Milestone Contract, the active repository path, the same-workspace file isolation rules, and the verification commands.
2. **Reactive coordination (No polling loops):**
   - After launching `teamwork`, do not poll or loop on status checks. The runtime automatically wakes you when `teamwork` sends a progress report, a blocker question, or a completion message.
   - When the user provides new instructions or answers a question for an active run, forward the update to the existing `teamwork` conversation ID using `send_message`.
3. **Fast-path fallback for single-turn parallel slices:**
   If the user's request is a short, single-turn task (such as 2 to 3 independent file edits or parallel read-only checks that will finish in minutes without needing cron monitoring), you may spawn `self` or `research` subagents directly via `invoke_subagent` under the same Milestone Contract rules and tell the user why direct fan-out was used.

## 4. Verify and hand back

When `teamwork` reports that all milestones are complete:

1. Do not trust a subagent's summary alone. Run `git status` and `git diff --stat` to audit all touched files.
2. Execute the final verification and test commands yourself to confirm a clean pass.
3. If the `no-comments` and `unslop` skills are available, apply them to clean up any unnecessary comments and format the final report.
4. Report what landed per milestone, the verification command outputs, and any follow-up decisions for the user.
