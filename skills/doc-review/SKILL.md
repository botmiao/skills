---
name: doc-review
description: "Holistically review and align all project documentation (requirement/PRD docs, technical/architecture docs, database schema docs, API interface docs, README.md, and AGENTS.md) against the current codebase. Updates code-truth docs directly, surfaces requirement discrepancies for user decision, and chains the agents-maintain skill. Use for /doc-review, 'review all docs', or code-documentation alignment."
---
# Holistic code-vs-documentation review and alignment

Audit every documentation asset in the repository against the current codebase, repair factual drift, surface requirement-vs-implementation discrepancies for human judgment, and chain `AGENTS.md` maintenance.

## 1. Inventory and classify repository documents

Scan the repository (`README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/**`, `specs/**`, `design/**`, OpenAPI/schema specs) and group discovered documents into five categories:

1. **Database & Storage Docs:** table schemas, column types, indexes, relations, migrations, and cache/Redis key structures.
2. **API & Interface Docs:** HTTP/RPC routes, request parameters/DTOs, response payloads, error codes, auth requirements, and webhooks/events.
3. **Technical & Architecture Docs:** module boundaries, runtime data flows, state machines, configuration keys, and deployment topology.
4. **`README.md`:** project overview, prerequisites, quickstart/install/build/test commands, and directory layout.
5. **Requirement & Product Docs (PRD / Spec / ADR):** user stories, business rules, feature scope, and acceptance criteria.

*(Note: `AGENTS.md` and `CLAUDE.md` are handled in Step 4 via the `agents-maintain` skill.)*

## 2. Audit each category against the codebase

When multiple document categories exist, fan out read-only audit workers in parallel (using the `paseo-orchestrate` skill in Paseo, `invoke_subagent(TypeName="research")` in Antigravity, or the harness's subagent tool; if the `how` skill from `pstack` is available, use it to map subsystem architecture). Compare each document against its ground-truth code layer:

- **Database Docs vs. Source:** Compare against ORM models, Prisma/Drizzle/SQLAlchemy schemas, and SQL migrations. Flag added, renamed, or deleted tables/columns, type mismatches, and outdated index or constraint notes.
- **API Docs vs. Source:** Compare against route definitions, controllers, handlers, and request/response validation schemas (such as Zod, TypeBox, Pydantic, Protobuf, or TypeScript interfaces). Flag missing endpoints, removed routes, and mismatched parameters or status codes.
- **Technical Docs vs. Source:** Compare against the current directory structure, module imports, state reducers, and environment variable readers (`process.env`, config loaders). Flag dead modules, renamed packages, or obsolete architecture diagrams.
- **`README.md` vs. Source & Terminal:** Compare documented scripts against `package.json`, `Makefile`, `pyproject.toml`, or `Cargo.toml`. **Run the `Quickstart`, build, and test commands from `README.md` in the terminal** (applying the `principle-prove-it-works` skill if available) to verify that every command succeeds as written.
- **Requirement / PRD Docs vs. Source:** Check whether each documented requirement or business rule matches the implemented code. Classify every mismatch into one of two buckets:
  1. **Design Evolution:** the implementation intentionally evolved (for example a simplified flow or renamed concept) and the PRD was never updated.
  2. **Implementation Gap / Potential Bug:** a requirement or edge case in the PRD is missing or contradicted by the code, and it is unclear whether the code has a bug or the requirement was dropped.

## 3. Apply asymmetric reconciliation rules

Never treat all documentation drift the same way. Follow these rules by category:

### A. Code-truth documents (Database, API, Technical Docs, and `README.md`)

For these four categories, **the working source code is the source of truth**:

1. Directly update the Database, API, Technical, and `README.md` files to match the current codebase.
2. Replace outdated examples, flags, field names, and directory trees with accurate facts from the source code.
3. If the `technical-writing` and `unslop` skills are available, apply them so all updated sections use clear, concise, active prose with no AI filler or em dashes.

### B. Intent documents (Requirement / PRD / Spec Docs)

For requirement documents, **code is not automatically right** (an unimplemented requirement may be a bug in the code):

1. Do **not** silently delete unimplemented features from requirement documents to make them match the code.
2. Present a **Requirement vs. Code Discrepancy Table** to the user with three columns:
   - `Document & Section`
   - `What the Doc Says vs. What the Code Does`
   - `Recommended Action` (`Update doc to match evolved design` or `Keep doc and file/fix code bug`)
3. Ask the user to confirm how to resolve ambiguous requirement items before editing those PRD sections (or apply clearly evolutionary wording updates and highlight them in the final report).

## 4. Chain `AGENTS.md` maintenance and pitfall archiving

After auditing the project docs above, load and execute the **`agents-maintain` skill** (`skills/agents-maintain/SKILL.md`) to audit `AGENTS.md` (and `CLAUDE.md`), prune obsolete rules, and move resolved historical pitfalls into `docs/archive/agents-history.md`.

## 5. Final review report

Return a structured summary containing:

1. **Documents Audited:** list of all files checked by category.
2. **Code-Truth Drift Fixed:** summary of updates made to Database, API, Technical docs, and `README.md` (plus terminal verification output for `README.md` commands).
3. **Requirement Discrepancies (Needs Confirmation / Bug Candidates):** the table from Step 3B.
4. **`AGENTS.md` Maintenance & Archive Summary:** the output from the chained `agents-maintain` pass.
