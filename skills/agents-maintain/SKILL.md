---
name: agents-maintain
description: "Audit, slim down, and maintain AGENTS.md (and CLAUDE.md) against the current codebase. Verifies commands and module boundaries, upgrades recurring pitfalls into code/type/lint checks, and moves resolved historical pitfalls that can no longer occur into docs/archive/agents-history.md. Use for /agents-maintain, 'clean up AGENTS.md', or archiving resolved pitfalls."
---
# AGENTS.md maintenance and historical pitfall archiving

Keep `AGENTS.md` (and `CLAUDE.md` when present) accurate, compact, and high-signal by verifying every rule against the current codebase and moving resolved historical pitfalls into an on-demand archive file.

## Why this skill exists

As a project evolves, developers and agents add troubleshooting notes, temporary workarounds, and historical pitfalls ("gotchas") to `AGENTS.md`. Once the underlying bugs are fixed or refactored away, those warnings become dead weight: they consume context-window tokens on every turn and confuse agents about the current architecture.

## 1. Parse and inventory `AGENTS.md`

Read `AGENTS.md` (and `CLAUDE.md` if present) and break its contents into individual items:

- Build, test, lint, and verification commands.
- Directory ownership and architecture boundary rules.
- Coding style and workflow conventions.
- Historical pitfalls, bug warnings, workarounds, and "do not touch / watch out for X" notes.

## 2. Verify each item against the current codebase

For every item in the inventory, inspect the current source tree, `package.json` / build scripts, type definitions, linter rules, test suite, and `git log`:

1. Check whether referenced files, directories, functions, flags, and scripts still exist.
2. For each historical pitfall or workaround note, trace the code path it describes and answer two questions:
   - **Can an agent still hit this pitfall in the current codebase?** Or has a later refactor, bug fix, schema change, or type constraint eliminated the root cause?
   - **If the pitfall is still possible, can it be blocked automatically by code** (a type, a lint check, a runtime assertion, or a test) instead of a text warning?

## 3. Triage every item into four lifecycle states

Assign each item in `AGENTS.md` to one of these four states and execute its action:

### State 1: `ACTIVE` (Keep in `AGENTS.md`)

- **Criteria:** The command, module boundary, or constraint is accurate and active today, and it requires agent judgment that cannot be enforced purely by the compiler or linter.
- **Action:** Keep it in `AGENTS.md`. Tighten the prose (apply the `unslop` skill if available): use short imperative sentences, replace vague advice with exact file paths and commands, and remove long backstory narratives.

### State 2: `RESOLVED -> ARCHIVE` (Move to `docs/archive/agents-history.md`)

- **Criteria:** The pitfall or workaround was valid in the past, but its root cause has been fixed in the code, types, or architecture so agents working on the current codebase will no longer encounter it. However, the history explains *why* the code is shaped a certain way and is worth keeping as reference material.
- **Action:**
  1. Remove the pitfall from `AGENTS.md`.
  2. Append it to `docs/archive/agents-history.md` (create the directory and file if they do not exist) using this structure:
     ```markdown
     ### [YYYY-MM-DD] <Short title of the resolved pitfall>
     - **Historical Pitfall:** <What used to go wrong or the old rule from AGENTS.md>
     - **Why It Is Resolved:** <Exact file, type, refactor, test, or commit that eliminated the issue>
     ```

### State 3: `HARDEN -> ARCHIVE` (Encode in code/checks, then archive)

- **Criteria:** The pitfall is still possible today, and `AGENTS.md` is currently the only defense against it, **but** it can be prevented structurally (apply the `correct` and `principle-encode-lessons-in-structure` skills from `pstack` if available).
- **Action:**
  1. Enforce the rule at the highest possible level:
     - **Architecture / API:** delete the footgun API or hide internal exports.
     - **Types:** tighten the type signature so invalid calls fail typechecking.
     - **Lint / Validation Script:** add a check script whose error message names the right pattern to use.
     - **Test:** add a behavioral test that fails if the invariant breaks.
  2. Once the structural check is verified (or proposed to the user if it requires a broader code refactor), move the prose warning out of `AGENTS.md` and into `docs/archive/agents-history.md`, and record the active check in `AGENTS.md`'s rule-enforcement table if present.

### State 4: `OBSOLETE -> DELETE` (Delete completely)

- **Criteria:** The rule references deleted files, abandoned third-party libraries, or obsolete workflows that have no current or historical value.
- **Action:** Delete the item completely without archiving.

## 4. Link the archive without polluting context

At the bottom of `AGENTS.md`, ensure there is a single pointer line:

```markdown
## Historical pitfalls archive

Resolved historical pitfalls and retired workarounds live in [`docs/archive/agents-history.md`](docs/archive/agents-history.md). Do not read that file during normal tasks; consult it only when investigating historical context or regressions.
```

## 5. Report the maintenance results

Output a summary with:

1. **Triage Table:** each audited item from `AGENTS.md`, its assigned state (`ACTIVE`, `RESOLVED -> ARCHIVE`, `HARDEN -> ARCHIVE`, or `OBSOLETE -> DELETE`), and the evidence from the codebase.
2. **Archived Items:** list of pitfalls moved to `docs/archive/agents-history.md`.
3. **Hardened Checks:** any new lint checks, types, or tests added (or recommended).
4. **Size Reduction:** before vs. after line count of `AGENTS.md`.
