#!/usr/bin/env node
// Nightly regression helpers for CI, sharing run_flows' code so the results have the
// same shape the QA agents read locally.
//
//   node src/nightly.ts run [--device <udid>]   run the regression suite, print the summary path
//                                               (also as the `summary` step output in Actions),
//                                               exit 1 unless every flow passed
//   node src/nightly.ts report <summary.json>   print a Markdown report of a run
import { appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';

import { MAIN_CHECKOUT, REPO_ROOT } from './paths.ts';
import { runFlows, type RunSummary } from './runs.ts';

const SUITE_TAG = 'regression';

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function run() {
  const summary = await runFlows({ checkout: MAIN_CHECKOUT, tags: [SUITE_TAG], device: option('--device') });
  const summaryFile = path.join(summary.artifactsDir, 'summary.json');
  console.log(summary.output);
  console.log(summaryFile);
  // In GitHub Actions, expose it as the step's `summary` output.
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `summary=${summaryFile}\n`);
  process.exitCode = summary.status === 'passed' ? 0 : 1;
}

function cell(text: string | undefined) {
  return (text ?? '').replace(/\s+/g, ' ').replace(/\|/g, '\\|').slice(0, 300);
}

async function report(summaryFile: string) {
  const summary: RunSummary = JSON.parse(await readFile(path.resolve(REPO_ROOT, summaryFile), 'utf8'));
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_SHA } = process.env;
  const runUrl = GITHUB_RUN_ID ? `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}` : null;
  const failed = summary.flows.filter((flow) => flow.status === 'failed');
  const heading = {
    passed: `✅ ${summary.flows.length}/${summary.flows.length} flows passed`,
    failed: `❌ ${failed.length}/${summary.flows.length} flows failed`,
    error: '⚠️ Maestro produced no results',
  }[summary.status];

  const lines = [
    `## Nightly regression: ${heading}`,
    '',
    [
      summary.finishedAt.slice(0, 10),
      GITHUB_SHA ? `commit \`${GITHUB_SHA.slice(0, 7)}\`` : null,
      summary.device ? `device \`${summary.device}\`` : null,
      runUrl ? `[workflow run](${runUrl})` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    '',
  ];
  if (summary.flows.length > 0) {
    lines.push('| Flow | Result | Failure |', '|---|---|---|');
    for (const flow of summary.flows) {
      lines.push(`| \`${flow.file}\` | ${flow.status === 'passed' ? '✅' : '❌'} | ${cell(flow.failure)} |`);
    }
  } else {
    lines.push('```', summary.output.slice(-1500), '```');
  }
  if (summary.status !== 'passed') {
    lines.push(
      '',
      `Screenshots, view hierarchies and logs are in the run's \`nightly-regression\` artifact. ` +
        `To triage, run \`/triage-nightly${GITHUB_RUN_ID ? ` ${GITHUB_RUN_ID}` : ''}\` in Claude Code.`
    );
  }
  console.log(lines.join('\n'));
}

const [command, argument] = process.argv.slice(2);
if (command === 'run') await run();
else if (command === 'report' && argument) await report(argument);
else {
  console.error('Usage: node src/nightly.ts run [--device <udid>] | report <summary.json>');
  process.exitCode = 2;
}
