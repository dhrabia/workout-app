#!/usr/bin/env node
// workout-qa-mcp: QA tools for the mobile app's Maestro suite, exposed over MCP (stdio).
import path from 'node:path';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { listYamlFiles, loadFlow, loadFlows } from './flows.ts';
import { resolveCheckout } from './paths.ts';
import { readLatestResults, runFlows } from './runs.ts';
import { createTestIdMatcher, scanTestIds } from './test-ids.ts';

const server = new McpServer({ name: 'workout-qa', version: '1.0.0' });

function json(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] };
}

const TICKET_KEY = z
  .string()
  .regex(/^[A-Z][A-Z0-9]+-\d+$/, 'Jira issue key, e.g. SCRUM-12')
  .describe('Jira issue key, e.g. SCRUM-12');

const CHECKOUT = z
  .string()
  .optional()
  .describe(
    'Path to a git worktree of this repo whose flows and app code to use, e.g. the QA worktree with a PR checked out. ' +
      'Defaults to the checkout this server runs from.'
  );

server.registerTool(
  'coverage_for_ticket',
  {
    title: 'Coverage for a Jira ticket',
    description:
      'Lists the Maestro flows tagged with a Jira issue key (tags: [SCRUM-12]) and the result of their last run on ' +
      'the main checkout. Only flows in the regression suite carry ticket tags, so an empty list is normal for most tickets.',
    inputSchema: { ticket: TICKET_KEY, checkout: CHECKOUT },
    annotations: { readOnlyHint: true },
  },
  async ({ ticket, checkout: checkoutPath }) => {
    const latest = await readLatestResults();
    const flows = (await loadFlows(await resolveCheckout(checkoutPath)))
      .filter((flow) => flow.tags.some((tag) => tag.toUpperCase() === ticket))
      .map((flow) => ({ file: flow.file, name: flow.name, tags: flow.tags, lastRun: latest[flow.file] ?? null }));
    return json({ ticket, covered: flows.length > 0, flows });
  }
);

server.registerTool(
  'run_flows',
  {
    title: 'Run Maestro flows',
    description:
      'Runs Maestro flows on the booted simulator/emulator and returns per-flow results: status, failure message, ' +
      'and paths to the screenshot and view hierarchy at the failing step. Pass a ticket, tags or flow paths; with ' +
      'none, runs the whole suite. Pass checkout to run the flows of another worktree (it needs apps/mobile/.env.local). ' +
      'Needs the app installed on the device and the QA accounts seeded (pnpm --filter mobile qa:seed). A run takes ' +
      'from tens of seconds to several minutes.',
    inputSchema: {
      ticket: TICKET_KEY.optional().describe('Run the flows tagged with this Jira issue key'),
      tags: z.array(z.string()).optional().describe('Run flows having any of these tags, e.g. ["regression"]'),
      paths: z
        .array(z.string())
        .optional()
        .describe('Flow files relative to the checkout root, e.g. ["apps/mobile/.maestro/flows/login.yaml"]'),
      checkout: CHECKOUT,
      device: z.string().optional().describe('Device id (UDID); defaults to the booted iOS simulator'),
    },
  },
  async ({ ticket, tags, paths, checkout, device }) => {
    const allTags = [...(ticket ? [ticket] : []), ...(tags ?? [])];
    return json(await runFlows({ checkout: await resolveCheckout(checkout), tags: allTags, paths, device }));
  }
);

server.registerTool(
  'audit_test_ids',
  {
    title: 'Audit missing testIDs',
    description:
      "Finds React Native interactive primitives (Pressable, Touchable*, Button, TextInput, Switch) in the app's " +
      'screens and components that have no testID, so flows cannot target them reliably. maybeViaSpread means the ' +
      'element spreads props and may still receive a testID from its caller.',
    inputSchema: {
      path: z.string().optional().describe('Only report files whose repo-relative path contains this, e.g. "app/onboarding"'),
      checkout: CHECKOUT,
    },
    annotations: { readOnlyHint: true },
  },
  async ({ path: filter, checkout }) => {
    const { missing } = await scanTestIds(await resolveCheckout(checkout));
    const findings = filter ? missing.filter((finding) => finding.file.includes(filter)) : missing;
    return json({ count: findings.length, missing: findings });
  }
);

server.registerTool(
  'check_flow_selectors',
  {
    title: 'Check flow selectors',
    description:
      'Checks every `id:` selector in the Maestro flows and subflows against the testIDs defined in the app code ' +
      '(including dynamic ones like plan-card-<id> and suffixes added by shared components like <modal>-save). ' +
      'Reports selectors that match no testID, which would make the flow fail.',
    inputSchema: {
      paths: z.array(z.string()).optional().describe('Flow files relative to the checkout root; defaults to all flows and subflows'),
      checkout: CHECKOUT,
    },
    annotations: { readOnlyHint: true },
  },
  async ({ paths, checkout: checkoutPath }) => {
    const checkout = await resolveCheckout(checkoutPath);
    const files = paths?.length
      ? paths.map((p) => path.resolve(checkout.root, p))
      : [...(await listYamlFiles(checkout.flowsDir)), ...(await listYamlFiles(checkout.subflowsDir))];
    const flows = await Promise.all(files.map((file) => loadFlow(file, checkout.root)));
    const matcher = createTestIdMatcher((await scanTestIds(checkout)).definitions);

    const unknown: { file: string; line: number; id: string }[] = [];
    const unchecked: { file: string; line: number; id: string; reason: string }[] = [];
    let checked = 0;
    for (const flow of flows) {
      for (const { id, line } of flow.selectors) {
        if (id.includes('${')) {
          unchecked.push({ file: flow.file, line, id, reason: 'uses a variable' });
        } else if (/[.*+?^()|[\]\\]/.test(id) && !matcher.exact.has(id)) {
          unchecked.push({ file: flow.file, line, id, reason: 'regex selector' });
        } else {
          checked++;
          if (!matcher.exists(id)) unknown.push({ file: flow.file, line, id });
        }
      }
    }
    return json({ ok: unknown.length === 0, checked, unknown, unchecked });
  }
);

await server.connect(new StdioServerTransport());
