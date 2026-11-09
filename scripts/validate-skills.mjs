#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const SKILLS_DIR = path.join(REPO_ROOT, "skills");

const KNOWN_PSTACK_SKILLS = new Set([
  "architect",
  "arena",
  "automate-me",
  "benchmark-checklist",
  "blast-radius",
  "bro",
  "correct",
  "create-formal-verification-skill",
  "create-verification-skill",
  "figure-it-out",
  "how",
  "in-your-own-words",
  "interrogate",
  "ketchup",
  "ketchup-video",
  "maintain-formal-verification-skill",
  "maintain-verification-skill",
  "make-bot-ui",
  "no-comments",
  "poteto-help",
  "poteto-mode",
  "reflect",
  "recall",
  "setup-pstack",
  "sharpen",
  "show-me-your-work",
  "statechart",
  "swarm",
  "tdd",
  "teach",
  "technical-writing",
  "typescript-best-practices",
  "unslop",
  "why",
  "principle-attack-the-premise",
  "principle-boundary-discipline",
  "principle-build-the-lever",
  "principle-encode-lessons-in-structure",
  "principle-exhaust-the-design-space",
  "principle-experience-first",
  "principle-explain-the-number",
  "principle-fix-root-causes",
  "principle-foundational-thinking",
  "principle-guard-the-context-window",
  "principle-laziness-protocol",
  "principle-make-operations-idempotent",
  "principle-migrate-callers-then-delete-legacy-apis",
  "principle-minimize-reader-load",
  "principle-model-the-domain",
  "principle-never-block-on-the-human",
  "principle-outcome-oriented-execution",
  "principle-prove-it-works",
  "principle-redesign-from-first-principles",
  "principle-separate-before-serializing-shared-state",
  "principle-sequence-verifiable-units",
  "principle-subtract-before-you-add",
  "principle-test-behavior-not-implementation",
  "principle-type-system-discipline",
]);

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    return null;
  }
  const fields = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      fields[key] = val;
    }
  }
  return fields;
}

function collectMarkdownFiles(dir, result = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectMarkdownFiles(fullPath, result);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      result.push(fullPath);
    }
  }
  return result;
}

const errors = [];

if (!fs.existsSync(SKILLS_DIR)) {
  console.error(`Missing skills directory at ${SKILLS_DIR}`);
  process.exit(1);
}

const localSkills = new Set(
  fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
);

for (const skillName of localSkills) {
  const skillFile = path.join(SKILLS_DIR, skillName, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    errors.push(`[${skillName}] Missing SKILL.md at ${skillFile}`);
    continue;
  }
  const content = fs.readFileSync(skillFile, "utf8");
  const fm = parseFrontmatter(content);
  if (!fm) {
    errors.push(`[${skillName}] SKILL.md is missing YAML frontmatter (--- ... ---)`);
    continue;
  }
  if (fm.name !== skillName) {
    errors.push(
      `[${skillName}] Frontmatter name "${fm.name}" does not match directory name "${skillName}"`
    );
  }
  if (!fm.description || fm.description.length < 15) {
    errors.push(`[${skillName}] Frontmatter description is missing or too short`);
  }
}

const allMdFiles = [
  ...collectMarkdownFiles(SKILLS_DIR),
  ...["AGENTS.md", "README.md"]
    .map((f) => path.join(REPO_ROOT, f))
    .filter((p) => fs.existsSync(p)),
];

const linkRegex = /\[[^\]]+\]\(([^)]+)\)/g;

for (const mdFile of allMdFiles) {
  const relFile = path.relative(REPO_ROOT, mdFile);
  const content = fs.readFileSync(mdFile, "utf8");

  if (content.includes("\u2014")) {
    errors.push(
      `[${relFile}] Contains em dash (U+2014). Rewrite with periods or commas per /unslop rule 13.`
    );
  }

  const lines = content.split("\n");
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    for (const match of line.matchAll(linkRegex)) {
      const rawTarget = match[1].split("#")[0].trim();
      if (
        !rawTarget ||
        rawTarget.startsWith("http://") ||
        rawTarget.startsWith("https://") ||
        rawTarget.startsWith("file://") ||
        rawTarget.startsWith("mailto:")
      ) {
        continue;
      }

      const resolved = path.resolve(path.dirname(mdFile), rawTarget);
      if (resolved.startsWith(SKILLS_DIR) && resolved !== SKILLS_DIR) {
        const relToSkills = path.relative(SKILLS_DIR, resolved);
        const topSegment = relToSkills.split(path.sep)[0];
        if (localSkills.has(topSegment)) {
          if (!fs.existsSync(resolved)) {
            errors.push(
              `[${relFile}:${i + 1}] Broken local skill link "${rawTarget}" (resolved to missing ${path.relative(REPO_ROOT, resolved)})`
            );
          }
        } else if (!KNOWN_PSTACK_SKILLS.has(topSegment)) {
          errors.push(
            `[${relFile}:${i + 1}] Unknown sibling skill "${topSegment}" in link "${rawTarget}". Add to skills/ or verify pstack skill name.`
          );
        }
      } else if (resolved.startsWith(REPO_ROOT)) {
        if (!fs.existsSync(resolved)) {
          errors.push(
            `[${relFile}:${i + 1}] Broken repo link "${rawTarget}" (resolved to missing ${path.relative(REPO_ROOT, resolved)})`
          );
        }
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Validation failed with ${errors.length} error(s):`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log(
  `PASS: Validated ${localSkills.size} skills (${Array.from(localSkills).sort().join(", ")}) and ${allMdFiles.length} markdown files.`
);
