#!/bin/sh
# PreToolUse hook for QA agents: allow Write/Edit only on Maestro flows and subflows
# of this repo or one of its git worktrees (e.g. the QA worktree with a PR checked
# out), so a QA agent can never change app code to make a test pass.
file=$(jq -r '.tool_input.file_path // empty')
project="${CLAUDE_PROJECT_DIR:-$(pwd)}"

case "$file" in
  *..*) ;;
  *)
    worktrees=$(git -C "$project" worktree list --porcelain 2>/dev/null | sed -n 's/^worktree //p')
    # One path per line; paths may contain spaces.
    IFS='
'
    for root in "$project" $worktrees; do
      case "$file" in
        "$root"/apps/mobile/.maestro/flows/*.yaml | "$root"/apps/mobile/.maestro/subflows/*.yaml) exit 0 ;;
      esac
    done
    ;;
esac

echo "Blocked: QA agents may only edit apps/mobile/.maestro/flows/*.yaml and subflows/*.yaml (got: $file). Report app changes as a ticket for developers instead." >&2
exit 2
