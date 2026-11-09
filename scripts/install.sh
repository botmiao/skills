#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SKILLS_SRC="${REPO_ROOT}/skills"

DRY_RUN=false
COPY_MODE=false
TARGET_DIRS=()

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Install botmiao/skills into your agent skill directories.

Options:
  --target <dir>       Install into a specific skills directory (can be passed multiple times).
                       Defaults to auto-detecting ~/.gemini/skills and ~/.agents/skills.
  --copy               Copy skill directories instead of creating symlinks.
  --dry-run            Print actions without modifying the filesystem.
  -h, --help           Show this help message.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET_DIRS+=("$2")
      shift 2
      ;;
    --copy)
      COPY_MODE=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ ${#TARGET_DIRS[@]} -eq 0 ]]; then
  if [[ -d "${HOME}/.gemini" ]]; then
    TARGET_DIRS+=("${HOME}/.gemini/skills")
  fi
  TARGET_DIRS+=("${HOME}/.agents/skills")
  if [[ -d "${HOME}/.claude" ]]; then
    TARGET_DIRS+=("${HOME}/.claude/skills")
  fi
  if [[ -d "${HOME}/.cursor" ]]; then
    TARGET_DIRS+=("${HOME}/.cursor/skills")
  fi
fi

install_skill_dir() {
  local src_dir="$1"
  local dest_root="$2"
  local skill_name
  skill_name="$(basename "${src_dir}")"
  local dest_path="${dest_root}/${skill_name}"

  if [[ "${DRY_RUN}" == "true" ]]; then
    if [[ "${COPY_MODE}" == "true" ]]; then
      echo "[dry-run] copy ${src_dir} -> ${dest_path}"
    else
      echo "[dry-run] ln -sfn ${src_dir} -> ${dest_path}"
    fi
    return 0
  fi

  mkdir -p "${dest_root}"
  if [[ "${COPY_MODE}" == "true" ]]; then
    rm -rf "${dest_path}"
    cp -R "${src_dir}" "${dest_path}"
  else
    rm -rf "${dest_path}"
    ln -s "${src_dir}" "${dest_path}"
  fi
}

for target in "${TARGET_DIRS[@]}"; do
  echo "==> Target skill directory: ${target}"
  custom_count=0
  for skill in "${SKILLS_SRC}"/*/; do
    [[ -f "${skill}/SKILL.md" ]] || continue
    install_skill_dir "${skill%/}" "${target}"
    custom_count=$((custom_count + 1))
  done
  echo "    Installed ${custom_count} skills from ${SKILLS_SRC}"
done
