import { execFile, spawn } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { XMLParser } from 'fast-xml-parser';

import { type Checkout, MAESTRO_SCRIPT, MAIN_CHECKOUT, REPO_ROOT, relativeTo, RESULTS_DIR } from './paths.ts';

export type FlowResult = {
  name: string;
  file: string; // relative to the checkout root
  status: 'passed' | 'failed';
  seconds: number;
  failure?: string;
  screenshots: string[]; // relative to this repo's root
  hierarchy: string[]; // view hierarchy dumps at the failing step, relative to this repo's root
};

export type RunSummary = {
  runId: string;
  finishedAt: string;
  checkout: string; // absolute path of the checkout whose flows ran
  device: string | null;
  command: string;
  // `error`: Maestro didn't produce a report (bad flow syntax, no device, app not installed).
  status: 'passed' | 'failed' | 'error';
  flows: FlowResult[];
  output: string; // tail of Maestro's console output
  artifactsDir: string; // relative to this repo's root
};

export type LatestResult = Pick<FlowResult, 'name' | 'status' | 'failure'> & { runId: string; finishedAt: string };

const LATEST_FILE = path.join(RESULTS_DIR, 'latest.json');
const OUTPUT_TAIL = 4000;
// Maestro writes flow env (QA_PASSWORD) into its debug output; these values are
// replaced in every text artifact, since CI uploads them from a public repo.
const SECRET_VARS = ['QA_PASSWORD', 'SUPABASE_SERVICE_ROLE_KEY'];
const BINARY_ARTIFACT = /\.(png|jpe?g|mp4|mov)$/i;
const REDACTED = '***';

const execFileAsync = promisify(execFile);

// Maestro stops to ask which device to use when more than one is connected, which
// would hang a non-interactive run, so pick the booted iOS simulator up front.
async function bootedIosSimulator(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('xcrun', ['simctl', 'list', 'devices', 'booted', '-j']);
    const devices = Object.values(JSON.parse(stdout).devices as Record<string, { udid: string }[]>).flat();
    return devices[0]?.udid ?? null;
  } catch {
    return null;
  }
}

async function listFiles(dir: string) {
  const entries = await readdir(dir).catch(() => []);
  return entries.sort().map((entry) => relativeTo(REPO_ROOT, path.join(dir, entry)));
}

function toArray<T>(value: T | T[] | undefined): T[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

async function parseReport(reportFile: string, debugDir: string, checkout: Checkout): Promise<FlowResult[] | null> {
  const xml = await readFile(reportFile, 'utf8').catch(() => null);
  if (xml === null) return null;

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const suites = toArray(parser.parse(xml).testsuites?.testsuite);
  const cases = suites.flatMap((suite) => toArray(suite.testcase));

  return Promise.all(
    cases.map(async (testCase): Promise<FlowResult> => {
      const flowDebugDir = path.join(debugDir, String(testCase.name));
      const failure = testCase.failure === undefined ? undefined : String(testCase.failure?.['#text'] ?? testCase.failure);
      return {
        name: String(testCase.name),
        // Maestro reports the file relative to where it ran (apps/mobile).
        file: relativeTo(checkout.root, path.resolve(checkout.mobileDir, String(testCase.file))),
        status: testCase.status === 'SUCCESS' ? 'passed' : 'failed',
        seconds: Number(testCase.time),
        failure,
        screenshots: await listFiles(path.join(flowDebugDir, 'screenshots')),
        hierarchy: await listFiles(path.join(flowDebugDir, 'screen-hierarchy')),
      };
    })
  );
}

async function secretValues(checkout: Checkout): Promise<string[]> {
  const envLocal = await readFile(path.join(checkout.mobileDir, '.env.local'), 'utf8').catch(() => '');
  const values = SECRET_VARS.flatMap((name) => [
    envLocal.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim().replace(/^(["'])(.*)\1$/, '$2'),
    process.env[name],
  ]);
  // Short values would redact unrelated text; Supabase requires 6+ character passwords anyway.
  return [...new Set(values.filter((value): value is string => !!value && value.length >= 6))];
}

function redact(text: string, secrets: string[]) {
  return secrets.reduce((result, secret) => result.split(secret).join(REDACTED), text);
}

async function redactArtifacts(dir: string, secrets: string[]) {
  if (secrets.length === 0) return;
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (!entry.isFile() || BINARY_ARTIFACT.test(entry.name)) continue;
    const file = path.join(entry.parentPath, entry.name);
    const text = await readFile(file, 'utf8');
    const redacted = redact(text, secrets);
    if (redacted !== text) await writeFile(file, redacted);
  }
}

export async function readLatestResults(): Promise<Record<string, LatestResult>> {
  const text = await readFile(LATEST_FILE, 'utf8').catch(() => '{}');
  return JSON.parse(text);
}

export async function runFlows(options: {
  checkout: Checkout;
  tags?: string[];
  paths?: string[];
  device?: string;
}): Promise<RunSummary> {
  const { checkout } = options;
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = path.join(RESULTS_DIR, runId);
  const reportFile = path.join(runDir, 'report.xml');
  const debugDir = path.join(runDir, 'debug');
  await mkdir(runDir, { recursive: true });

  const device = options.device ?? (await bootedIosSimulator());
  const targets = options.paths?.length ? options.paths.map((p) => path.resolve(checkout.root, p)) : [checkout.maestroDir];
  const args = [
    MAESTRO_SCRIPT,
    '--format',
    'junit',
    '--output',
    reportFile,
    '--debug-output',
    debugDir,
    '--flatten-debug-output',
    ...(device ? ['--udid', device] : []),
    ...(options.tags?.length ? ['--include-tags', options.tags.join(',')] : []),
    ...targets,
  ];

  const output = await new Promise<string>((resolve) => {
    let text = '';
    // cwd is the checkout's app dir: maestro.sh loads its .env.local and Maestro reports flow paths relative to it.
    const child = spawn('sh', args, { cwd: checkout.mobileDir, env: process.env });
    const append = (chunk: Buffer) => {
      text = (text + chunk.toString()).slice(-OUTPUT_TAIL);
    };
    child.stdout.on('data', append);
    child.stderr.on('data', append);
    child.on('error', (error) => resolve(`${text}\n${error.message}`));
    child.on('close', () => resolve(text));
  });

  const flows = await parseReport(reportFile, debugDir, checkout);
  const finishedAt = new Date().toISOString();
  const secrets = await secretValues(checkout);
  const unredacted: RunSummary = {
    runId,
    finishedAt,
    checkout: checkout.root,
    device,
    command: `cd ${checkout.mobileDir} && sh ${args.map((arg) => (arg.includes(' ') ? `"${arg}"` : arg)).join(' ')}`,
    status: flows === null || flows.length === 0 ? 'error' : flows.every((flow) => flow.status === 'passed') ? 'passed' : 'failed',
    flows: flows ?? [],
    output: output.trim(),
    artifactsDir: relativeTo(REPO_ROOT, runDir),
  };
  const summary: RunSummary = JSON.parse(redact(JSON.stringify(unredacted), secrets));
  await redactArtifacts(runDir, secrets);
  await writeFile(path.join(runDir, 'summary.json'), JSON.stringify(summary, null, 2));

  // latest.json tracks the suite on this checkout; runs on a PR worktree don't overwrite it.
  if (summary.flows.length > 0 && checkout.root === MAIN_CHECKOUT.root) {
    const latest = await readLatestResults();
    for (const flow of summary.flows) {
      latest[flow.file] = { name: flow.name, status: flow.status, failure: flow.failure, runId, finishedAt };
    }
    await writeFile(LATEST_FILE, JSON.stringify(latest, null, 2));
  }

  return summary;
}
