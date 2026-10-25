import { execFile } from 'node:child_process';
import { realpath } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

// The checkout this server runs from. Run artifacts always go here, even when the
// flows come from another worktree (e.g. the QA worktree with a PR checked out).
export const REPO_ROOT = path.resolve(import.meta.dirname, '../../..');
export const MAESTRO_SCRIPT = path.join(REPO_ROOT, 'apps/mobile/scripts/maestro.sh');
// Run artifacts (JUnit report, screenshots, logs); git-ignored.
export const RESULTS_DIR = path.join(REPO_ROOT, 'apps/mobile/.maestro/.results');

export type Checkout = {
  root: string;
  mobileDir: string;
  maestroDir: string;
  flowsDir: string;
  subflowsDir: string;
  // App code scanned for testIDs.
  sourceDirs: string[];
};

export function checkoutPaths(root: string): Checkout {
  const mobileDir = path.join(root, 'apps/mobile');
  const maestroDir = path.join(mobileDir, '.maestro');
  return {
    root,
    mobileDir,
    maestroDir,
    flowsDir: path.join(maestroDir, 'flows'),
    subflowsDir: path.join(maestroDir, 'subflows'),
    sourceDirs: [path.join(mobileDir, 'app'), path.join(mobileDir, 'components')],
  };
}

export const MAIN_CHECKOUT = checkoutPaths(REPO_ROOT);

const execFileAsync = promisify(execFile);

// Accepts this repo or one of its git worktrees, so a tool can't be pointed at an
// arbitrary directory.
export async function resolveCheckout(input?: string): Promise<Checkout> {
  if (!input) return MAIN_CHECKOUT;
  const wanted = await realpath(path.resolve(REPO_ROOT, input)).catch(() => {
    throw new Error(`Checkout not found: ${input}`);
  });
  if (wanted === (await realpath(REPO_ROOT))) return MAIN_CHECKOUT;
  const { stdout } = await execFileAsync('git', ['-C', REPO_ROOT, 'worktree', 'list', '--porcelain']);
  const worktrees = stdout
    .split('\n')
    .filter((line) => line.startsWith('worktree '))
    .map((line) => line.slice('worktree '.length));
  for (const worktree of worktrees) {
    if ((await realpath(worktree).catch(() => null)) === wanted) return checkoutPaths(wanted);
  }
  throw new Error(`${input} is not a git worktree of ${REPO_ROOT} (see git worktree list)`);
}

export function relativeTo(root: string, absolutePath: string) {
  return path.relative(root, absolutePath);
}
