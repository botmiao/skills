# Changelog

All notable changes to `botmiao/skills` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-21

### Added
- `release-flow`: general-purpose version release and Git sync skill supporting `mode1` (local temporary test release), `mode2` (cross-device code sync without version bumps or tags), and `mode3` (formal SemVer remote tag release with quality gates, CI/CD release-script detection, and `CHANGELOG.md` maintenance).
- `t3code-orchestrate`: 3-tier multi-agent orchestration skill for T3Code Orchestrator V2 (shared workspace, isolated Git worktrees, and cross-device Linked Environments) with per-role custom model selection and fallback routing.
- `paseo-orchestrate`: Paseo multi-agent orchestration skill with Agent Profile matching and 4-stage shared-workspace pipeline.
- `agy-teamwork`: Antigravity `teamwork` orchestration skill with Milestone Contracts and runnable verification gates.
- `doc-review`: holistic code-vs-documentation audit and alignment skill chaining `agents-maintain`.
- `agents-maintain`: `AGENTS.md` governance and historical pitfall archiving skill.
- Validation and installation scripts (`scripts/validate-skills.mjs` and `scripts/install.sh`).
