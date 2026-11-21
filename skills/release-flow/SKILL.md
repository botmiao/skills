---
name: release-flow
description: "General-purpose version release and Git sync workflow following SemVer 2.0.0 and Conventional Commits across three modes: mode1 = local temporary test release without touching remote Git/tags, mode2 = cross-device code sync via commit and push without bumping versions or creating tags, and mode3 = formal remote release with SemVer bump, verification gates, CHANGELOG.md maintenance, CI/CD release-script detection (and interactive scaffolding if missing), commit, annotated tag, and push. Supports shorthand triggers 'release-flow mode1', 'release-flow mode2', 'release-flow mode3', as well as /release-flow, 'local test release', 'sync code to another device', 'release a version', 'tag and push', '临时本地发布', '同步代码换设备', '版本发布', or '打tag发布'."
---
# Version release and Git sync workflow

Execute safe, repeatable version releases and cross-device Git syncs across any repository stack while following SemVer 2.0.0, Conventional Commits, and strict Git guardrails.

## Quick mode shortcuts

When the user passes a shorthand command, skip mode-classification prompts and proceed directly to Preflight followed by the selected mode:

| Shorthand | Mode | Summary |
|---|---|---|
| `release-flow mode1` (or `/release-flow mode1`, `mode1`) | **Mode 1: Local Temporary Test Release** | Build/package a testable version locally; never push or create remote tags. |
| `release-flow mode2` (or `/release-flow mode2`, `mode2`) | **Mode 2: Cross-Device Code Sync** | Commit and push current work to resume on another device; no version bump, no changelog, no tag. |
| `release-flow mode3` (or `/release-flow mode3`, `mode3`) | **Mode 3: Formal Remote Release** | SemVer bump, verification gates, CI/CD release-script check/scaffolding, `CHANGELOG.md`, commit, annotated tag, and push. |

## 1. Preflight and mode classification

Before mutating any files or running Git write commands, inspect the repository state:

1. **Git state:**
   - Run `git status --short --branch` to inspect current branch, staged/unstaged files, and untracked files.
   - Run `git fetch --tags --prune` (skip only if offline or no remote is configured) and `git describe --tags --abbrev=0` to find the latest tag and check ahead/behind status against upstream.
2. **Project stack and version manifests:**
   - Detect all version-bearing manifests present in the repository so multi-file projects stay in lockstep:
     - Node / JS / TS: `package.json` (plus workspace packages if monorepo)
     - Python: `pyproject.toml`, `setup.cfg`, or package `__version__`
     - Rust: `Cargo.toml` (workspace or crate)
     - Go: Git tag driven (`vX.Y.Z`) plus optional version constant file
     - Tauri / Electron / Mobile / JVM: `src-tauri/tauri.conf.json`, `pubspec.yaml`, `build.gradle` / `build.gradle.kts`, `Info.plist` / `project.pbxproj`
   - Detect verification and build commands from `AGENTS.md`, `README.md`, `package.json`, `Makefile`, `pyproject.toml`, or `Cargo.toml`.
3. **Classify the request into one of three modes** (skip asking if the user already specified `mode1` / `mode2` / `mode3` or stated the intent clearly):
   - **Mode 1 (`mode1`):** Local Temporary Test Release.
   - **Mode 2 (`mode2`):** Cross-Device Code Sync.
   - **Mode 3 (`mode3`):** Formal Remote Release with Tag & CI Detection.

---

## Mode 1: Local temporary test release (`release-flow mode1`)

Produce a local testable build or package without polluting remote Git history, remote tags, or stable version numbers.

1. **Working tree policy:** Dirty working trees are allowed for quick local tests. Note any uncommitted changes clearly in the final summary.
2. **Temporary version identifier:**
   - Use a SemVer pre-release identifier: `<current-or-next>-local.<YYYYMMDD>.<short-sha>` (or `<next>-rc.<n>` if the user specifies an RC).
   - If the build system supports injecting the version via environment variable or CLI flag, prefer that over editing tracked files.
   - If tracked version manifests must be edited for the build, record the original values and offer to restore them immediately after the build completes (default: restore version files after packaging so `-local` versions are never accidentally committed).
3. **Build and package:**
   - Run the detected local build or packaging command (for example `npm pack`, `pnpm build`, `cargo build --release`, `tauri build`, `flutter build`, or `docker build`).
   - Apply the `principle-prove-it-works` skill if available: verify the produced artifact exists and inspect its size/path.
4. **Hard restriction:** Never run `git push`, never create remote tags, and never publish to a remote registry in Mode 1.
5. **Report:** Output the temporary version string, exact artifact path(s), whether version manifests were restored, and the local install or test command.

---

## Mode 2: Cross-device code sync (`release-flow mode2`)

Safely save and push work in progress so the user can pick up seamlessly on another machine without triggering releases or polluting the default branch.

1. **Branch protection check:**
   - If the current branch is `main` or `master` and the working tree contains unfinished WIP changes, warn the user and offer two options:
     - **(Recommended)** Create or switch to a working branch such as `wip/<short-topic>` or `feat/<short-topic>` and push there.
     - Stay on the current branch if the changes are clean, self-contained, and safe to share on `main`.
2. **Safety scan before staging:**
   - Inspect `git status` and `git diff --stat`.
   - Refuse to stage secrets (`.env`, `*.pem`, `*.key`, credentials), build caches, or large untracked binaries unless explicitly confirmed.
3. **Remote divergence check:**
   - Run `git fetch origin`.
   - If the remote branch has newer commits, sync cleanly with `git pull --rebase origin <branch>` (or stop and let the user resolve conflicts). Never silently force-push.
4. **Commit without release side effects:**
   - Do **not** bump version numbers, do **not** edit `CHANGELOG.md`, and do **not** create any tags.
   - Use a clear commit message:
     - Clean milestone: standard Conventional Commit (`feat(<scope>): ...`, `fix(<scope>): ...`).
     - In-progress handoff: `wip(<scope>): <completed summary>; next: <next step>`.
5. **Push and print a handoff summary:**
   - Run `git push -u origin <branch>`.
   - Return a concise handoff block containing:
     - Branch name and commit SHA
     - Exact resume command for the other device:
       ```bash
       git fetch origin && git checkout <branch> && git pull --ff-only
       ```
     - Brief bullet list of what is done and what remains next.

---

## Mode 3: Formal remote release with tag and CI detection (`release-flow mode3`)

Cut a clean, verifiable release following SemVer 2.0.0 and Conventional Commits, ensuring automated build/release infrastructure is checked before pushing a tag.

### Step 3.1: Calculate the next version (SemVer 2.0.0)

1. Inspect commits since the last tag: `git log <last-tag>..HEAD --oneline` (or full history if no tag exists yet).
2. Recommend the next version based on commit impact:
   - **MAJOR (`X+1.0.0`):** any `BREAKING CHANGE` footer, `!:` breaking type, or incompatible API/schema change.
   - **MINOR (`X.Y+1.0`):** `feat:` backwards-compatible new capability.
   - **PATCH (`X.Y.Z+1`):** `fix:`, `perf:`, `refactor:`, or maintenance changes.
   - **Pre-release (`X.Y.Z-alpha.1` / `beta.1` / `rc.1`):** when the user asks for a preview or pre-release.
   - For `0.x.y` projects, follow the repository's existing convention (typically minor for breaking/features, patch for fixes) and call it out explicitly.
3. Match the repository's existing tag prefix convention (default `vX.Y.Z` when no prior tags exist).
4. Present the proposed version transition (`<old> -> <new>`) and commit summary to the user for confirmation before editing version files.

### Step 3.2: Pre-release quality gates

1. **Branch and remote check:** Confirm the current branch is the intended release branch (warn if detached HEAD, non-default branch, or behind remote).
2. **Secret and hygiene check:** Verify no `.env`, private keys, credentials, or unintended temporary files are staged.
3. **Run verification gates:** Execute the project's lint, typecheck, test, and build commands (apply `principle-prove-it-works` if available).
   - If any check fails, stop immediately, report the failure, and do not proceed with tagging or pushing unless the user explicitly overrides.

### Step 3.3: Automated build and release script detection

Before creating or pushing a release tag, scan the repository for automated build/release pipelines:

1. Check CI/CD workflows:
   - `.github/workflows/*.yml` and `.github/workflows/*.yaml` (inspect `on.push.tags` and `on.release` triggers)
   - `.gitlab-ci.yml`, `.circleci/config.yml`, `Jenkinsfile`, `azure-pipelines.yml`
2. Check release automation configs and scripts:
   - `scripts/release.*`, `Makefile` release targets, `.goreleaser.yml` / `.goreleaser.yaml`, `release-please-config.json`, `.changeset/`, `.releaserc*`
3. **Branch on detection result:**
   - **If automation is found:**
     - Report which workflow or script will run when the tag is pushed.
     - Verify that the new tag matches its trigger pattern (for example `tags: ['v*']` vs bare `X.Y.Z`). Warn and fix any mismatch before tagging.
   - **If NO automated build/release script is found:**
     - **Pause and ask the user:** "No automated build/release workflow or script was found in this repository. Would you like me to create one (for example, a GitHub Actions release workflow triggered on `v*` tags) before pushing the tag?"
     - **If the user agrees:** Scaffold a minimal, stack-appropriate workflow (such as `.github/workflows/release.yml` that checks out code, runs build/test, packages artifacts, and publishes a GitHub Release on `v*` tags), validate its syntax, and include it in a dedicated `ci: add release workflow` commit (or the release commit if preferred).
     - **If the user declines:** Continue with the release as-is. After pushing the tag, offer to create a GitHub Release via `gh release create <tag> --generate-notes` if `gh` is available.

### Step 3.4: Bump, changelog, commit, tag, and push

1. **Update version manifests in lockstep:** Update every detected version file (and lockfile if required by the package manager) to the confirmed version.
2. **Update `CHANGELOG.md`:**
   - If `CHANGELOG.md` already exists, prepend a new section for the release in Keep a Changelog format (`Added`, `Changed`, `Fixed`, `Breaking`) with today's date (`YYYY-MM-DD`), derived from the actual commits since the last tag.
   - If `CHANGELOG.md` does not exist, ask the user once whether to create it (or skip if they prefer GitHub Release notes only).
3. **Commit and create an annotated tag:**
   - Stage only the intended release files (never blindly `git add -A` if unrelated untracked files exist).
   - Commit with `chore(release): <tag>` (or match the repo's existing release commit style).
   - Create an annotated tag: `git tag -a <tag> -m "Release <tag>"`.
4. **Push branch and specific tag:**
   - Run `git push origin <branch> && git push origin <tag>`.
   - **Never run `git push --tags`**, which can push unrelated local test tags.
5. **Post-push verification:**
   - If GitHub Actions and `gh` CLI are available, inspect the triggered workflow run (`gh run list --limit 3`) and report its status or URL.

---

## Universal safety guardrails

- **No silent force-push:** Never run `git push --force` or `--force-with-lease` on `main`/`master`, and never overwrite an existing remote tag without explicit user confirmation.
- **No blind tag push:** Never use `git push --tags`; always push the exact tag name (`git push origin <tag>`).
- **No silent hook bypass:** Never pass `--no-verify` unless the user explicitly instructs it.
- **No secret leaks:** Always inspect staged paths before committing to block `.env` and credential files.
- **Recovery instructions on failure:** If a release fails after local commit/tag creation but before push, provide the exact local rollback commands (`git tag -d <tag>` and `git reset --soft HEAD~1`).
