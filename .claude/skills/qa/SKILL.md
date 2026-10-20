---
name: qa
description: QA conventions for workout-app - Maestro flow structure and tags, testID naming, QA test accounts, how to run flows, how to tell an app bug from an outdated test, and the bug report template. Use when writing, running, reviewing or triaging Maestro flows, planning tests for a SCRUM ticket, or reporting a bug found while testing the mobile app.
---

# QA for workout-app

The mobile app (`apps/mobile`, Expo + Supabase) is tested end to end with Maestro. Flows live in `apps/mobile/.maestro`. For where things are in the app and which `testID`s exist on each screen, read [references/screen-map.md](references/screen-map.md).

## Role boundary

QA work changes only `apps/mobile/.maestro/` (and test data through `qa:seed`). Never edit app code to make a test pass. If a flow needs a `testID` that doesn't exist, or the app behaves differently from the ticket, report it to the developers as a Jira ticket (see the templates below) and leave the app code alone.

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

Every flow has at least one **suite** tag and one **area** tag. Add the **ticket** tag when the flow covers a Jira ticket:

| Kind | Values | Purpose |
| --- | --- | --- |
| Suite | `smoke`, `regression` | `smoke` = critical paths run on every PR (keep it fast); `regression` = everything else |
| Area | `onboarding`, `auth`, `profile`, `plans`, `workout`, `body` | Pick flows affected by a change |
| Ticket | `SCRUM-<number>` | Trace coverage per Jira ticket; a flow can list several |

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
pnpm --filter mobile e2e:smoke                                        # smoke suite
pnpm --filter mobile e2e                                              # everything
cd apps/mobile && sh scripts/maestro.sh --include-tags SCRUM-12 .maestro   # one ticket
cd apps/mobile && sh scripts/maestro.sh .maestro/flows/login.yaml          # one flow
```

`scripts/maestro.sh` loads `.env.local` and passes `APP_ID` (default `com.woapp.mobile`) and `QA_PASSWORD` to the flows.

## Triage: what a failing flow means

Decide before reporting anything. Re-run a failing flow once before classifying it.

| Verdict | Signs | Action |
| --- | --- | --- |
| **App bug** | App behavior contradicts the ticket's acceptance criteria or the screen map; crash; error message; data not saved | Bug ticket (template below) |
| **Outdated test** | The app changed on purpose (merged ticket, renamed copy or `testID`) and the flow still expects the old behavior | Fix the flow in a PR; mention the ticket that changed the app |
| **Missing testability** | The element exists but has no `testID`, or the `testID` isn't unique | Ticket for developers: "Add testID `<id>` to `<element>` on `<screen>`" |
| **Flaky** | Passes on re-run with no change; timing-dependent | Fix waits in the flow; if it stays flaky, tag the cause in the PR description |
| **Environment** | Supabase unreachable, account missing (run `qa:seed`), simulator or build problem | Fix the setup, don't report a bug |

When in doubt between app bug and outdated test, check the ticket's acceptance criteria and recent commits touching the screen. If they don't settle it, ask a human instead of guessing.

## Bug report template

Title: `<Screen>: <what goes wrong>` (e.g. "Log in: wrong password shows no error message")

```
**Environment:** iOS 18.x simulator / Android API 35 emulator · build <version or commit> · Supabase <project ref>
**Account:** qa-onboarded@example.com
**Flow:** apps/mobile/.maestro/flows/<file>.yaml (step <n>)

**Steps to reproduce**
1. ...

**Expected:** ... (quote the acceptance criterion if there is one)
**Actual:** ...

**Attachments:** screenshot / Maestro output
**Related:** SCRUM-<ticket the bug was found while testing>
```

Bugs reported by an agent get the `agent-reported` label so a human verifies them before they're scheduled.
