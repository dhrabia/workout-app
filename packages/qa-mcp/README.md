# @workout-app/qa-mcp

MCP server (stdio) with QA tools for the mobile app's Maestro suite. Claude Code starts it from the repo's `.mcp.json` as `workout-qa`; it runs on Node 24 directly from the TypeScript sources, with no build step.

| Tool | What it does |
| --- | --- |
| `coverage_for_ticket` | Lists flows tagged with a Jira key (e.g. `SCRUM-12`) and their last run result |
| `run_flows` | Runs flows by ticket, tags or paths on the booted simulator through `apps/mobile/scripts/maestro.sh`; returns per-flow status, failure message and paths to the failing step's screenshot and view hierarchy |
| `audit_test_ids` | Finds `Pressable`, `Touchable*`, `Button`, `TextInput` and `Switch` elements without a `testID` in `apps/mobile/app` and `components` |
| `check_flow_selectors` | Checks every `id:` selector in flows and subflows against the testIDs in the app code, including dynamic ids (`plan-card-<id>`) and suffixes added by shared components (`weight-modal-save`) |

Every tool takes an optional `checkout`: the path of a git worktree of this repo (such as the QA worktree with a PR checked out) whose flows and app code to use. It defaults to the checkout the server runs from; other directories are refused. Flows from another worktree still run through this checkout's `apps/mobile/scripts/maestro.sh`, with that worktree's `apps/mobile/.env.local`.

Run artifacts are always written to this checkout's `apps/mobile/.maestro/.results/`, which is git-ignored. The last result per flow (`latest.json`, used by `coverage_for_ticket`) only tracks runs on this checkout.

The package also pins [agent-device](https://github.com/callstack/agent-device) (`devDependencies`), which `.mcp.json` starts as the `agent-device` MCP server for testing PRs on a device.

```bash
pnpm --filter @workout-app/qa-mcp typecheck
```

To try it outside Claude Code, use the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node packages/qa-mcp/src/index.ts
```
