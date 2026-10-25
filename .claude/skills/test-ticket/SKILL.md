---
name: test-ticket
description: Runs the agentic QA loop for one workout-app Jira ticket in Ready for QA - finds its open pull request, builds it on the iOS simulator, plans checks (qa-test-planner), verifies the PR on the device with agent-device (qa-pr-tester), triages failures (qa-triager), decides on regression suite changes (qa-regression-curator), then reports to Jira and opens a separate PR with flow changes after the user approves. Use when QA asks to test, QA or verify a SCRUM ticket ("test SCRUM-12", "przetestuj SCRUM-12").
argument-hint: <JIRA-KEY>
---

# Test a Jira ticket in Ready for QA

Ticket: `$ARGUMENTS` (a Jira key such as `SCRUM-12`; ask for it if missing).

QA starts this by hand when a ticket reaches Ready for QA. The feature PR is still open then: it is merged only after QA passes. You orchestrate; the subagents do the work. Follow the qa skill for every convention.

Nothing leaves this machine (Jira comments and issues, git pushes, pull requests) before step 9, and only what the user approves there.

Paths used below:
- `MAIN`: this checkout (`git rev-parse --show-toplevel`). The QA tools and run artifacts live here.
- `QA_WT`: the QA worktree, `$MAIN-qa` (a sibling directory, outside the repo so Metro doesn't see two copies of the workspace). Kept between runs so builds are incremental.
- `EVIDENCE`: `$MAIN/apps/mobile/.maestro/.results/<KEY>-<yyyymmdd-hhmm>/` (git-ignored). Everything from this run goes here.

## 0. Preflight

Check and stop with a clear fix if something is missing:
- **Jira:** an Atlassian/Jira MCP tool can read the ticket. If not, ask the user to connect the Atlassian connector.
- **QA tools:** the `workout-qa` and `agent-device` MCP tools are available (`.mcp.json`; a new session may be needed after it changes).
- **GitHub:** `gh auth status` succeeds.
- **Device:** an iOS simulator is booted: `xcrun simctl list devices booted`. Note its UDID.
- **Accounts:** `apps/mobile/.env.local` has `QA_PASSWORD` (check with `grep -c '^QA_PASSWORD=.' apps/mobile/.env.local`; never print the file).

## 1. Ticket and pull request

1. Read the ticket. If its status isn't Ready for QA, tell the user and ask whether to continue.
2. Find its open PR: `gh pr list --state open --limit 100 --json number,title,url,headRefName,headRefOid,baseRefName`, keeping PRs whose title or head branch contains the key. None: stop and ask for the PR number. More than one: ask which one.
3. Save the diff: `gh pr diff <number> > "$EVIDENCE/pr.diff"`.

## 2. QA worktree

1. Create it once: `git worktree add --detach "$QA_WT"`. If it exists and `git -C "$QA_WT" status --porcelain` isn't empty, stop: it has unfinished work from an earlier run. Show it to the user and ask what to do.
2. `git -C "$QA_WT" fetch origin <headRefName>`, then:
   - if `origin/qa/<KEY>-regression` exists (a regression PR from an earlier round of this ticket): `git -C "$QA_WT" switch -C qa/<KEY>-regression origin/qa/<KEY>-regression` and `git -C "$QA_WT" merge --no-edit origin/<headRefName>`. This merge stays local until step 9. On a conflict, stop and ask;
   - otherwise: `git -C "$QA_WT" switch --detach origin/<headRefName>`.
3. Copy the untracked env files: `cp apps/mobile/.env apps/mobile/.env.local "$QA_WT/apps/mobile/"`.
4. `pnpm -C "$QA_WT" install --frozen-lockfile`.

## 3. Build and install

Run in the background, it takes minutes (the first build in a fresh worktree, with prebuild and pods, can take 15+):

```bash
cd "$QA_WT/apps/mobile" && npx expo run:ios --configuration Release --device <UDID> --no-bundler
```

If the PR changes native dependencies or `app.json`, run `npx expo prebuild --clean --platform ios` first. When it finishes, check `xcrun simctl listapps <UDID> | grep com.woapp.mobile`. A build error is an environment or app problem: report it to the user with the error and stop.

## 4. Plan

Delegate to **qa-test-planner** with the key, the PR number and URL, `$EVIDENCE/pr.diff` and `$QA_WT`. Show the user the checks, the changes not in the ticket, the testability gaps and open questions in a few lines. If an open question changes what to test, ask the user before continuing.

## 5. Verify on the device

Delegate to **qa-pr-tester** with the full checklist, app id `com.woapp.mobile`, the UDID and `$EVIDENCE` as the evidence directory. If it needs a fresh install for a check, reinstall the build you made in step 3 (`xcrun simctl uninstall`, then `install` the `.app` from that build's output) and send it back to the tester.

## 6. Triage

If a check failed or the tester reported observations that look wrong, delegate to **qa-triager** with the failures, the key, the checklist and `$QA_WT`. Skip when everything passed.

## 7. Regression suite

Delegate to **qa-regression-curator** with the key, `$EVIDENCE/pr.diff`, the checklist, the tester's results and `$QA_WT`. It edits flows in `$QA_WT` only. Then:
- delete the flows it lists under Delete: `git -C "$QA_WT" rm <file>`;
- if it reports failures that look like app bugs, send them to **qa-triager** too;
- review `git -C "$QA_WT" status` and `git -C "$QA_WT" diff`: only `apps/mobile/.maestro/flows/` and `subflows/` may have changed.

## 8. Report

Write `$EVIDENCE/report.md` and show the user a short summary:
- checks: passed / failed / blocked / manual, with the verdict of each failure
- draft bugs and testability gaps
- regression decisions and the flow diff (or "no flow changes")
- overall: ready to merge from QA's side, or not

## 9. Approvals

Show the user exactly what will be sent, and ask. Do each item only after a yes for it:

1. **Regression PR** (only if flows changed). In `$QA_WT`: `git switch -c qa/<KEY>-regression` if not already on it, stage only `apps/mobile/.maestro/flows` and `apps/mobile/.maestro/subflows`, commit as `test(e2e): update regression flows for <KEY>` with the decision table in the body, `git push -u origin qa/<KEY>-regression`. If the PR doesn't exist yet: `gh pr create --base <headRefName> --head qa/<KEY>-regression --title "test(e2e): regression flows for <KEY>"`, with a body that lists the decisions and says: stacked on #<number>; merge after it (GitHub retargets this PR to `main` when `<headRefName>` is deleted after the merge).
2. **Jira comment** on the ticket (template below), with the regression PR link if there is one.
3. **Bugs:** each approved draft as a Bug in the ticket's project, labeled `agent-reported`, linked to the ticket ("relates to"), with its screenshots attached if the Jira tools allow it.
4. **Testability tasks:** a task for developers for each approved gap.

Never transition the ticket's status and never merge anything: a human decides.

Comment template:

```
QA (agentic) for <KEY> — <date>, PR #<number> @ <headRefOid short>, <device>

Result: <passed>/<device checks> checks passed · <n> blocked · <n> manual

Checks
✅ VC-1 <name>
❌ VC-2 <name> — <verdict>: <one line>; bug <BUG-KEY>
✋ VC-3 <name> — manual: <reason>

Regression suite: <n added, n updated, n deleted — PR <link>> | no changes (<one-line reason>)
Testability gaps: <testIDs to add, or none>
Open questions: <or none>
```

## 10. Hand back

Tell the user where things are: the evidence directory, the regression PR (if any), and that `$QA_WT` stays checked out for the next run. When the developer pushes fixes, the user runs `/test-ticket <KEY>` again: step 2 picks up the new commits and the existing regression branch.
