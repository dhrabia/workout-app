import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseAllDocuments } from 'yaml';

import { type Checkout, relativeTo } from './paths.ts';

export type FlowSelector = { id: string; line: number };

export type Flow = {
  file: string; // relative to the checkout root
  name: string;
  tags: string[];
  selectors: FlowSelector[];
};

// `id:` selectors as written in flows: `id: "login-submit-button"`, `- id: x`, `{ id: x }`.
const ID_SELECTOR = /(?:^|[\s{,-])id:\s*["']?([^"',}\s#]+)["']?/;

export async function listYamlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile() && /\.ya?ml$/.test(entry.name))
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

export async function loadFlow(file: string, root: string): Promise<Flow> {
  const text = await readFile(file, 'utf8');
  const docs = parseAllDocuments(text);
  // A flow is `<config>\n---\n<commands>`; a file with a single document has no config.
  const config = docs.length > 1 ? (docs[0].toJS() ?? {}) : {};

  const selectors: FlowSelector[] = [];
  text.split('\n').forEach((line, index) => {
    if (line.trimStart().startsWith('#')) return;
    const match = ID_SELECTOR.exec(line);
    if (match) selectors.push({ id: match[1], line: index + 1 });
  });

  return {
    file: relativeTo(root, file),
    name: typeof config.name === 'string' ? config.name : path.basename(file),
    tags: Array.isArray(config.tags) ? config.tags.map(String) : [],
    selectors,
  };
}

export async function loadFlows(checkout: Checkout): Promise<Flow[]> {
  return Promise.all((await listYamlFiles(checkout.flowsDir)).map((file) => loadFlow(file, checkout.root)));
}
