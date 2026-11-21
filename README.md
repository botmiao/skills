# botmiao/skills

Personal workflow skills for multi-agent orchestration (**Paseo**, **T3Code**, and **Antigravity Teamwork**), holistic **code-documentation alignment** (including `AGENTS.md` pitfall archiving), and **version release & cross-device Git sync**. External skills (such as `paseo` and `pstack`) are referenced softly via prompt instructions so this repository stays lightweight and self-contained.

## Quickstart

Prerequisites: Node.js 20+ and `bash`.

### Option A: Install via `npx skills`

```bash
npx skills add botmiao/skills
```

### Option B: Validate and install from a local checkout

```bash
node scripts/validate-skills.mjs
bash scripts/install.sh
```

Expected validation output:

```text
PASS: Validated 6 skills (agents-maintain, agy-teamwork, doc-review, paseo-orchestrate, release-flow, t3code-orchestrate) and 8 markdown files.
```

## Skill catalog

| Skill | Trigger | What it does |
|---|---|---|
| [`paseo-orchestrate`](skills/paseo-orchestrate/SKILL.md) | `/paseo-orchestrate`, "use paseo to orchestrate" | Loads the `paseo` skill, matches roles to saved Agent Profiles via user selection or `When to use` (`notes`), and coordinates a 4-stage shared-workspace pipeline: contract definition, parallel Backend/Frontend coding + unit test authoring (write-only without running builds/tests), unified build/unit-test/review by the Main Agent (plus optional read-only review agent), and multimodal integration/device testing. |
| [`t3code-orchestrate`](skills/t3code-orchestrate/SKILL.md) | `/t3code-orchestrate`, `$t3code-orchestrate`, "use t3code to orchestrate" | Drives T3Code Orchestrator V2 MCP tools (`orchestrator_capabilities`, `delegate_task`, `t3_thread_launch`, `t3_environment_links`, `preview_*`, `device_*`) across three progressive tiers: **Tier 1** shared-workspace 4-stage pipeline (default), **Tier 2** isolated Git worktrees for large-scale or overlapping refactors, and **Tier 3** cross-device Linked Environments across Windows, macOS, and Linux with explicit Git branch sync. Includes per-role custom model selection (`/t3code-orchestrate init`, hidden model search) and `Primary -> Fallback -> Auto/Inherit` routing. |
| [`agy-teamwork`](skills/agy-teamwork/SKILL.md) | `/agy-teamwork`, "use teamwork to orchestrate" | Builds a structured **Milestone Contract** (ordered milestones, `Workspace: "inherit"` file ownership boundaries, and runnable pass/fail verification commands) before dispatching work to Antigravity's `teamwork` sentinel (`invoke_subagent(TypeName="teamwork")`) or `self`/`research` subagents. |
| [`doc-review`](skills/doc-review/SKILL.md) | `/doc-review`, "review all docs against code" | Audits all repository documentation against the current codebase across five buckets: **Database docs**, **API docs**, **Technical/Architecture docs**, **`README.md`**, and **Requirement/PRD docs**. Updates factual docs directly from source truth, surfaces PRD-vs-code discrepancies in a decision table for human confirmation, and chains `agents-maintain`. |
| [`agents-maintain`](skills/agents-maintain/SKILL.md) | `/agents-maintain`, "clean up AGENTS.md" | Audits every rule and historical pitfall in `AGENTS.md` (and `CLAUDE.md`) against current code into four states: `ACTIVE` (keep and tighten), `RESOLVED -> ARCHIVE` (move resolved historical pitfalls into `docs/archive/agents-history.md`), `HARDEN -> ARCHIVE` (convert prose warnings into types/lints/tests, then archive), and `OBSOLETE -> DELETE`. |
| [`release-flow`](skills/release-flow/SKILL.md) | `/release-flow`, `release-flow mode1\|mode2\|mode3`, "版本发布", "同步代码换设备" | General-purpose SemVer release and Git sync workflow across three modes: **Mode 1 (`mode1`)** local temporary test release (no remote push/tags), **Mode 2 (`mode2`)** cross-device code sync without version bumps or tags, and **Mode 3 (`mode3`)** formal remote release with SemVer bump, pre-release verification gates, `CHANGELOG.md` update, CI/CD release-script detection (and interactive scaffolding if missing), annotated tag, and targeted push. |

## Project structure

- [`skills/paseo-orchestrate/SKILL.md`](skills/paseo-orchestrate/SKILL.md): Paseo multi-agent orchestration skill.
- [`skills/t3code-orchestrate/SKILL.md`](skills/t3code-orchestrate/SKILL.md): T3Code 3-tier multi-agent orchestration skill (shared workspace, Git worktree isolation, and cross-device Linked Environments).
- [`skills/agy-teamwork/SKILL.md`](skills/agy-teamwork/SKILL.md): Antigravity `teamwork` orchestration skill.
- [`skills/doc-review/SKILL.md`](skills/doc-review/SKILL.md): Holistic code-vs-documentation review and alignment skill.
- [`skills/agents-maintain/SKILL.md`](skills/agents-maintain/SKILL.md): `AGENTS.md` pruning and historical pitfall archiving skill.
- [`skills/release-flow/SKILL.md`](skills/release-flow/SKILL.md): General-purpose version release (local test & remote tag + CI check) and cross-device Git sync skill.
- [`scripts/validate-skills.mjs`](scripts/validate-skills.mjs): Zero-dependency validator for YAML frontmatter, markdown links, and formatting rules.
- [`scripts/install.sh`](scripts/install.sh): Idempotent installer linking skills into `~/.gemini/skills`, `~/.agents/skills`, `~/.claude/skills`, `~/.cursor/skills`, or `~/.codex/skills`.

## Development and verification

```bash
node scripts/validate-skills.mjs
bash scripts/install.sh --dry-run
```
