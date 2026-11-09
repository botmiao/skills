# botmiao/skills

Personal workflow skills for multi-agent orchestration (**Paseo** and **Antigravity Teamwork**) and holistic **code-documentation alignment** (including `AGENTS.md` pitfall archiving). External skills (such as `paseo` and `pstack`) are referenced softly via prompt instructions so this repository stays lightweight and self-contained.

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
PASS: Validated 4 skills (agents-maintain, agy-teamwork, doc-review, paseo-orchestrate) and 6 markdown files.
```

## Skill catalog

| Skill | Trigger | What it does |
|---|---|---|
| [`paseo-orchestrate`](skills/paseo-orchestrate/SKILL.md) | `/paseo-orchestrate`, "use paseo to orchestrate" | Loads the `paseo` skill, matches roles to saved Agent Profiles via user selection or `When to use` (`notes`), and coordinates a 4-stage shared-workspace pipeline: contract definition, parallel Backend/Frontend coding + unit test authoring (write-only without running builds/tests), unified build/unit-test/review by the Main Agent (plus optional read-only review agent), and multimodal integration/device testing. |
| [`agy-teamwork`](skills/agy-teamwork/SKILL.md) | `/agy-teamwork`, "use teamwork to orchestrate" | Builds a structured **Milestone Contract** (ordered milestones, `Workspace: "inherit"` file ownership boundaries, and runnable pass/fail verification commands) before dispatching work to Antigravity's `teamwork` sentinel (`invoke_subagent(TypeName="teamwork")`) or `self`/`research` subagents. |
| [`doc-review`](skills/doc-review/SKILL.md) | `/doc-review`, "review all docs against code" | Audits all repository documentation against the current codebase across five buckets: **Database docs**, **API docs**, **Technical/Architecture docs**, **`README.md`**, and **Requirement/PRD docs**. Updates factual docs directly from source truth, surfaces PRD-vs-code discrepancies in a decision table for human confirmation, and chains `agents-maintain`. |
| [`agents-maintain`](skills/agents-maintain/SKILL.md) | `/agents-maintain`, "clean up AGENTS.md" | Audits every rule and historical pitfall in `AGENTS.md` (and `CLAUDE.md`) against current code into four states: `ACTIVE` (keep and tighten), `RESOLVED -> ARCHIVE` (move resolved historical pitfalls into `docs/archive/agents-history.md`), `HARDEN -> ARCHIVE` (convert prose warnings into types/lints/tests, then archive), and `OBSOLETE -> DELETE`. |

## Project structure

- [`skills/paseo-orchestrate/SKILL.md`](skills/paseo-orchestrate/SKILL.md): Paseo multi-agent orchestration skill.
- [`skills/agy-teamwork/SKILL.md`](skills/agy-teamwork/SKILL.md): Antigravity `teamwork` orchestration skill.
- [`skills/doc-review/SKILL.md`](skills/doc-review/SKILL.md): Holistic code-vs-documentation review and alignment skill.
- [`skills/agents-maintain/SKILL.md`](skills/agents-maintain/SKILL.md): `AGENTS.md` pruning and historical pitfall archiving skill.
- [`scripts/validate-skills.mjs`](scripts/validate-skills.mjs): Zero-dependency validator for YAML frontmatter, markdown links, and formatting rules.
- [`scripts/install.sh`](scripts/install.sh): Idempotent installer linking skills into `~/.gemini/skills`, `~/.agents/skills`, `~/.claude/skills`, or `~/.cursor/skills`.

## Development and verification

```bash
node scripts/validate-skills.mjs
bash scripts/install.sh --dry-run
```
