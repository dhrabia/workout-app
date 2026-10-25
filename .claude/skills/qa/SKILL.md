---
name: qa
description: QA conventions for workout-app - how pull requests are verified with agent-device, the Maestro regression suite (flow structure, tags, when flows change), testID naming, QA test accounts, how to run flows, how to tell an app bug from an outdated test, and the bug report template. Use when testing a SCRUM ticket or its PR, writing, running, reviewing or triaging Maestro flows, or reporting a bug found while testing the mobile app.
---

# QA for workout-app

The mobile app (`apps/mobile`, Expo + Supabase) is tested end to end in two ways:

| | Changes in a pull request | Regression suite |
| --- | --- | --- |
| How | An agent drives the PR build on a simulator with [agent-device](https://github.com/callstack/agent-device), following a checklist made from the ticket and the diff | Deterministic Maestro flows in `apps/mobile/.maestro` |
| When | QA starts it by hand when the ticket reaches Ready for QA (`/test-ticket SCRUM-12`); the PR is merged only after QA passes | Nightly (not scheduled yet; run it with `pnpm --filter mobile e2e:regression`) |
| Output | Report with screenshots, Jira comment, draft bugs | Pass/fail per flow; failures go to triage |

Flows change only when a PR changes something worth guarding in the regression suite: then QA adds, updates or deletes flows in a **separate PR** stacked on the feature PR (`qa/SCRUM-12-regression`), merged after it. Most PRs need no flow changes.

For where things are in the app and which `testID`s exist on each screen, read [references/screen-map.md](references/screen-map.md).

## Role boundary

QA work changes only `apps/mobile/.maestro/` (and test data through `qa:seed`), through its own PRs. Never edit app code to make a test pass. If a flow needs a `testID` that doesn't exist, or the app behaves differently from the ticket, report it to the developers as a Jira ticket (see the templates below) and leave the app code alone.

## Flows

```
apps/mobile/.maestro/
├── config.yaml          # runs flows/*; subflows are only called from flows
├── flows/<name>.yaml    # one user scenario per file, flat (no subfolders)
└── subflows/<name>.yaml # reusable steps, e.g. log-in.yaml (EMAIL)
```

Each flow:
- starts with `appId: ${APP_ID}` and a `name` that states the expected behavior ("Log in with a wrong password shows an error"),
- starts from a known state (`launchApp: clearState: true`, or the `log-in` subflow),
- selects elements by `id:` (`testID`). Use visible text only for copy the test is meant to check,
- taps tabs by label (`tapOn: "Profile"`): the native tab bar has no `testID`s,
- dismisses system sheets it triggers (e.g. iOS "Save Password?" after log-in, handled in `subflows/log-in.yaml`) with an `optional: true` tap, so the same flow runs on both platforms,
- waits with `extendedWaitUntil` instead of fixed sleeps.

### Tags

Every flow has the **suite** tag and one **area** tag, plus the **ticket** tags of the tickets that added or changed it:

| Kind | Values | Purpose |
| --- | --- | --- |
| Suite | `regression` | The nightly suite; every flow belongs to it |
| Area | `onboarding`, `auth`, `profile`, `plans`, `workout`, `body` | Find flows affected by a change |
| Ticket | `SCRUM-<number>` | Trace which tickets a flow guards; a flow can list several |

### When the suite changes

Keep it small, stable and about what matters. For each user-visible change in a PR:
- **Add** a flow for new behavior that is user-critical (sign-up, log-in, onboarding, creating or running a workout, saving body data), stable and automatable.
- **Update** a flow when the PR intentionally changes what it checks (copy, `testID`, navigation, steps).
- **Delete** a flow when the PR removes the feature it tests.
- **No change** otherwise, including edge cases the PR verification already covered. This is the usual outcome.

```yaml
tags:
  - regression
  - auth
  - SCRUM-12
```

## testID naming

kebab-case, `<screen>-<element>-<type>`: `login-email-input`, `profile-logout-button`, `plan-form-save-button`.
- Common types: `-button`, `-input`, `-link`, `-toggle`, `-modal`, `-row`, `-card`, `-error`, `-screen`.
- Items in lists add the record id: `plan-card-<id>`, `weight-log-row-<id>`.
- Shared components derive child ids from the parent's `testID`: a modal `weight-modal` has `weight-modal-save` and `weight-modal-backdrop`; a stepper `exercise-form-sets` has `-minus`, `-plus`, `-value`.

## Test accounts

`pnpm --filter mobile qa:seed` creates or restores these accounts in the Supabase project from `apps/mobile/.env`. All share the password `QA_PASSWORD` from `apps/mobile/.env.local` (template: `.env.local.example`). Never write the password into a flow or a ticket; flows read it as `${QA_PASSWORD}`.

| Email | State |
| --- | --- |
| `qa-new@example.com` | Signed up, `onboarding_completed = false`, empty profile, no data |
| `qa-onboarded@example.com` | `onboarding_completed = true`, name "QA Onboarded", male, 30, 180 cm, target 75 kg |

- `qa:seed` resets the profile fields but keeps plans, logs and workouts. `qa:seed --reset` recreates the accounts with no data. Flows that need an empty account must not rely on leftovers from other flows.
- Sign-up flows register a new account each run as `qa-signup-<timestamp>@example.com`; `qa:seed --cleanup` deletes them.
- The seed script only touches `qa-*@example.com` accounts. Keep the account table here in sync with `TEST_USERS` in `apps/mobile/scripts/qa-seed-users.mjs`.

## Running

Needs Java 17+ and the Maestro CLI on `PATH`, and a simulator/emulator with a current build of the app installed (iOS: `cd apps/mobile && npx expo run:ios --configuration Release`).

```bash
pnpm --filter mobile qa:seed                                          # once, or to restore accounts
pnpm --filter mobile e2e:regression                                   # regression suite
pnpm --filter mobile e2e                                              # every flow
cd apps/mobile && sh scripts/maestro.sh --include-tags SCRUM-12 .maestro   # one ticket
cd apps/mobile && sh scripts/maestro.sh .maestro/flows/login.yaml          # one flow
```

`scripts/maestro.sh` loads `.env.local` and passes `APP_ID` (default `com.woapp.mobile`) and `QA_PASSWORD` to the flows.

## QA tools and agents

Two MCP servers are registered in `.mcp.json`:
- **`agent-device`** drives the app on a simulator or emulator (open, snapshot, press, fill, wait, screenshot, logs). It's pinned as a dependency of `packages/qa-mcp`; `agent-device help manual-qa` describes the testing loop.
- **`workout-qa`** (`packages/qa-mcp`) wraps the Maestro suite. Every tool takes an optional `checkout`: the path of a git worktree of this repo (e.g. the QA worktree with a PR checked out), defaulting to the main checkout.

| Tool | Use |
| --- | --- |
| `coverage_for_ticket` | Flows tagged with a Jira key and their last result on the main checkout |
| `run_flows` | Run by `ticket`, `tags` or `paths`; returns per-flow status, failure, screenshot and view hierarchy paths. Artifacts land in the main checkout's `apps/mobile/.maestro/.results/` (git-ignored) |
| `audit_test_ids` | Interactive React Native primitives without a `testID` |
| `check_flow_selectors` | `id:` selectors in flows that match no `testID` in the app |

Agents in `.claude/agents/`:

| Agent | Does | Can't |
| --- | --- | --- |
| **qa-test-planner** | Ticket + PR diff → verification checklist | Change files, use the device |
| **qa-pr-tester** | Runs the checklist on the device with agent-device, with screenshots | Change files, install the app |
| **qa-triager** | Failures → verdicts and draft bugs | Change files |
| **qa-regression-curator** | Decides on regression changes; adds or updates flows in the QA worktree | Edit anything but flows and subflows (hook) |

The `test-ticket` skill (`/test-ticket SCRUM-12`) runs them in order. It writes to Jira, pushes and opens the regression PR only after the user approves.

## Triage: what a failure means

Applies to failed checks on a PR and to failing flows. Decide before reporting anything. Reproduce once (repeat the check, re-run the flow) before classifying.

| Verdict | Signs | Action |
| --- | --- | --- |
| **App bug** | App behavior contradicts the ticket's acceptance criteria or the screen map; crash; error message; data not saved | Bug ticket (template below) |
| **Intended change / outdated test** | The app changed on purpose (the ticket asks for it, or a merged PR renamed copy or a `testID`) and the check or flow still expects the old behavior | Fix the checklist, or the flow in a regression PR; mention the ticket that changed the app |
| **Missing testability** | The element exists but has no `testID`, or the `testID` isn't unique | Ticket for developers: "Add testID `<id>` to `<element>` on `<screen>`" |
| **Flaky** | Passes on re-run with no change; timing-dependent | Fix waits in the flow; if it stays flaky, tag the cause in the PR description |
| **Environment** | Supabase unreachable, account missing (run `qa:seed`), simulator or build problem | Fix the setup, don't report a bug |

When in doubt between app bug and outdated test, check the ticket's acceptance criteria and recent commits touching the screen. If they don't settle it, ask a human instead of guessing.

## Bug report template

Title: `<Screen>: <what goes wrong>` (e.g. "Log in: wrong password shows no error message")

```
**Environment:** iOS 18.x simulator / Android API 35 emulator · build <version or commit> · Supabase <project ref>
**Account:** qa-onboarded@example.com
**Found by:** PR #<number> check VC-<n> / apps/mobile/.maestro/flows/<file>.yaml (step <n>)

**Steps to reproduce**
1. ...

**Expected:** ... (quote the acceptance criterion if there is one)
**Actual:** ...

**Attachments:** screenshot / agent-device or Maestro output
**Related:** SCRUM-<ticket the bug was found while testing>
```

Bugs reported by an agent get the `agent-reported` label so a human verifies them before they're scheduled.
