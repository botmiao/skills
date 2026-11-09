# AGENTS.md

Operational rules for coding agents maintaining `botmiao/skills`.

## Commands

Run these from the repository root (`/home/antigravity/botmiao/skills`):

| Task | Command | Pass condition |
|---|---|---|
| Validate skills and links | `node scripts/validate-skills.mjs` | Exits `0` and prints `PASS:` |
| Dry-run installer | `bash scripts/install.sh --dry-run` | Exits `0` |
| Install into active environment | `bash scripts/install.sh` | Exits `0` and links the 4 skills into `~/.gemini/skills` and `~/.agents/skills` |

## Architecture and module boundaries

- [`skills/paseo-orchestrate/`](skills/paseo-orchestrate/SKILL.md): Paseo multi-agent orchestration skill. Invokes the `paseo` skill, matches tasks to saved Agent Profiles via their `When to use` (`notes`) field (or explicit user choice), and runs workers inside the same workspace by default with strict file write boundaries.
- [`skills/agy-teamwork/`](skills/agy-teamwork/SKILL.md): Antigravity multi-agent orchestration skill. Frames a structured Milestone Contract with shared-workspace file isolation and runnable verification gates before dispatching to the `teamwork` sentinel (`invoke_subagent(TypeName="teamwork")`).
- [`skills/doc-review/`](skills/doc-review/SKILL.md): Holistic code-vs-documentation review skill. Audits Database, API, Technical, `README.md`, and Requirement (PRD/Spec) documents against the codebase, repairs factual drift, surfaces requirement gaps for human confirmation, and chains `agents-maintain`.
- [`skills/agents-maintain/`](skills/agents-maintain/SKILL.md): `AGENTS.md` governance and archiving skill. Audits every rule and pitfall in `AGENTS.md` against current code, moves resolved historical pitfalls into `docs/archive/agents-history.md`, and hardens recurring traps into types, lints, or tests.
- [`scripts/validate-skills.mjs`](scripts/validate-skills.mjs): structural validator for YAML frontmatter, markdown links, and `/unslop` formatting rules.
- [`scripts/install.sh`](scripts/install.sh): idempotent installer for Antigravity, Paseo, Claude Code, Cursor, and Codex skill directories.

## Skill authoring conventions

1. **Soft-reference external skills by name in prose.** Do not bundle third-party skill files in this repository. When a workflow benefits from an external skill (such as `paseo` or `pstack`'s `how`, `unslop`, `no-comments`, `correct`, `principle-prove-it-works`), reference it by name in the prompt instructions ("if the `<skill>` skill is available, apply it").
2. **Keep prose operational.** State the exact steps, tool calls, and verification checks. Avoid filler, marketing language, and em dashes (`U+2014`).

## Rule to enforcement table

Maintained by `agents-maintain`.

| Rule | Enforced by | Added / verified |
|---|---|---|
| Every skill directory under `skills/` must have a `SKILL.md` whose YAML `name` matches the directory name and a non-empty `description` | `node scripts/validate-skills.mjs` | 2026-11-09 |
| Every local markdown link inside `skills/`, `AGENTS.md`, and `README.md` must resolve to an existing file | `node scripts/validate-skills.mjs` | 2026-11-09 |
| No markdown file may contain the em-dash character (`U+2014`, rule 13 of `/unslop`) | `node scripts/validate-skills.mjs` | 2026-11-09 |
