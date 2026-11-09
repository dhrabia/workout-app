---
name: triage-nightly
description: Triages a failed nightly Maestro regression run of workout-app - downloads the GitHub Actions results, rebuilds the same commit on the iOS simulator, classifies each failure (qa-triager), proposes flow fixes for outdated tests (qa-regression-curator), then comments on the tracking issue, files Jira bugs and opens a flow fix PR after the user approves. Use when the nightly regression failed ("triage the nightly", "co padło w nocy", a "Nightly regression failing" issue).
argument-hint: "[workflow run id]"
---

# Triage a failed nightly regression run

Run: `$ARGUMENTS` (a GitHub Actions run id of the `Nightly regression` workflow; if missing, use the latest failed one).

You orchestrate; the subagents do the work. Follow the qa skill for every convention, especially the triage table. Nothing leaves this machine (issue comments, Jira issues, pushes, PRs) before step 6, and only what the user approves there.

Paths, as in the test-ticket skill:
- `MAIN`: this checkout (`git rev-parse --show-toplevel`).
- `QA_WT`: the QA worktree, `$MAIN-qa`, shared with `/test-ticket`.

## 0. Preflight

- **GitHub:** `gh auth status` succeeds.
- **QA tools:** the `workout-qa` and `agent-device` MCP tools are available.
- **Device:** an iOS simulator is booted (`xcrun simctl list devices booted`); note its UDID.
- **Jira** is needed only to file bugs in step 6; if the Atlassian tools are missing, say so and continue.

## 1. Pick the run

`gh run list --workflow nightly-regression.yml --limit 10 --json databaseId,conclusion,headSha,createdAt,url`. Use the given run id, or the latest run with conclusion `failure`. If the latest run passed, tell the user there's nothing to triage (the tracking issue closes itself on a passing night) and stop.

## 2. Results

1. `gh run download <id> --name nightly-regression --dir "$MAIN/apps/mobile/.maestro/.results"`. The artifact holds one `<runId>/` directory with `summary.json`, so the screenshot and view hierarchy paths in it resolve from `MAIN` as they are.
2. No artifact or no `summary.json`: the suite didn't run. Read `gh run view <id> --log-failed | tail -n 150`, explain which step failed (setup, secrets, build, simulator) and stop: that's an environment or build problem, not a test failure.
3. Note the failed flows, their failure messages, and the run's `headSha`.

## 3. Rebuild that commit

Prepare `$QA_WT` as in test-ticket steps 2 and 3, but on the nightly's commit instead of a PR:
1. Stop if `git -C "$QA_WT" status --porcelain` isn't empty (unfinished work from an earlier run); ask the user.
2. `git -C "$QA_WT" fetch origin main` and `git -C "$QA_WT" switch --detach <headSha>`.
3. Copy `apps/mobile/.env` and `apps/mobile/.env.local` into `$QA_WT/apps/mobile/`, then `pnpm -C "$QA_WT" install --frozen-lockfile`.
4. In the background: `cd "$QA_WT/apps/mobile" && npx expo run:ios --configuration Release --device <UDID> --no-bundler`.

## 4. Triage

Delegate to **qa-triager** with, per failed flow: the flow file, the failure message, the screenshot and view hierarchy paths from `summary.json`, the flow's `SCRUM-*` tags, and `$QA_WT` as the checkout to reproduce in (it re-runs each flow once with `run_flows`). Add `git -C "$QA_WT" log --oneline -15 -- <app files of the screen>` for each, so it can tell an intended change from a bug.

## 5. Fixes for outdated tests

For flows triaged as **Intended change / outdated test** (and **Flaky** ones with a clear waiting fix), delegate to **qa-regression-curator** with the triage, the commits that changed the screen, and `$QA_WT`. Tell it there is no PR: it should only update (or list for deletion) the failing flows, and run them in `$QA_WT`. Delete what it lists with `git -C "$QA_WT" rm`, and check that only `apps/mobile/.maestro/flows/` and `subflows/` changed.

## 6. Report and approvals

Show the user a short summary: per failed flow its verdict and evidence, the draft bugs, testability gaps, and the flow diff. Then show exactly what will be sent and ask; do each item only after a yes for it:

1. **Flow fix PR** (if flows changed): in `$QA_WT`, `git switch -c qa/nightly-<yyyymmdd>-fixes`, stage only `apps/mobile/.maestro/flows` and `subflows`, commit as `test(e2e): fix regression flows after nightly <yyyymmdd>`, push, and `gh pr create --base main` with the triage table and the commits that changed the app.
2. **Comment on the tracking issue** (`gh issue list --label nightly-regression --state open`): the triage table, links to the bugs and the fix PR. Don't close it; the next passing nightly closes it.
3. **Jira bugs:** each approved draft as a Bug labeled `agent-reported`, linked ("relates to") to the ticket from the flow's `SCRUM-*` tag or from the commit that changed the screen, when there is one.
4. **Testability tasks:** a task for developers for each approved gap.

## 7. Hand back

Tell the user what was sent and where, which failures still need a human, and that `$QA_WT` is left on the nightly commit (or the fix branch) for the next run.
