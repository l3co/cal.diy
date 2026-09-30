#!/usr/bin/env bash
# Publishes evidence images (screenshots/GIFs) to the orphan "evidence" branch, so they can be
# embedded in the PR description without entering the PR diff.
#
# Usage: scripts/pr-policy/publish-evidence.sh <file>...
# Prints one markdown image line per file, pointing at the published copy.
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "usage: $0 <file>..." >&2
  exit 2
fi

branch_slug="$(git rev-parse --abbrev-ref HEAD | sed 's/[^A-Za-z0-9._-]\+/-/g')"
repo_url="$(git remote get-url origin | sed -E 's#^git@github.com:#https://github.com/#; s#\.git$##')"
worktree="$(mktemp -d)"
temp_branch="evidence-publish-$$"

cleanup() {
  git worktree remove --force "$worktree" >/dev/null 2>&1 || true
  git branch -D "$temp_branch" >/dev/null 2>&1 || true
}
trap cleanup EXIT

if git fetch --quiet origin evidence 2>/dev/null; then
  git worktree add --quiet -b "$temp_branch" "$worktree" FETCH_HEAD
else
  git worktree add --quiet --orphan -b "$temp_branch" "$worktree"
fi

mkdir -p "$worktree/$branch_slug"
for file in "$@"; do
  cp "$file" "$worktree/$branch_slug/"
done

git -C "$worktree" add "$branch_slug"
git -C "$worktree" -c core.hooksPath=/dev/null commit --quiet -m "chore(evidence): add evidence for $branch_slug"
git -C "$worktree" push --quiet origin "HEAD:refs/heads/evidence"

for file in "$@"; do
  name="$(basename "$file")"
  echo "![${name%.*}](${repo_url}/blob/evidence/${branch_slug}/${name}?raw=true)"
done
