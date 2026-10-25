import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

import { type Checkout, relativeTo } from './paths.ts';

export type TestIdDefinition = {
  kind: 'exact' | 'pattern' | 'suffix';
  // exact: the id; pattern: a regex source for ids with dynamic parts (`plan-card-${id}`);
  // suffix: appended to a parent's testID by shared components (`${testID}-save`).
  value: string;
  file: string;
  line: number;
};

export type MissingTestId = {
  file: string;
  line: number;
  element: string;
  component: string | null;
  // The element spreads props, so a testID may still arrive through them.
  maybeViaSpread: boolean;
};

// Only React Native's interactive primitives are audited: app components (PlanCard,
// SubmitButton, ...) either set their own testID inside or forward the one they get,
// and a primitive inside them without a testID is reported there instead.
const INTERACTIVE_PRIMITIVES = new Set([
  'Pressable',
  'TouchableOpacity',
  'TouchableHighlight',
  'TouchableWithoutFeedback',
  'Button',
  'TextInput',
  'Switch',
]);
const TEST_ID_PROP = /testid/i;

async function listSourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort();
}

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function propName(name: ts.Node) {
  return ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : name.getText();
}

// Collects testID values from an attribute or property initializer, e.g.
// "x", `plan-card-${id}`, testID ? `${testID}-minus` : undefined.
function collectFromExpression(
  expression: ts.Node,
  add: (kind: TestIdDefinition['kind'], value: string, node: ts.Node) => void
) {
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (node.text) add('exact', node.text, node);
      return;
    }
    if (ts.isTemplateExpression(node)) {
      const [first] = node.templateSpans;
      const derivesFromParent =
        node.head.text === '' && TEST_ID_PROP.test(first.expression.getText()) && node.templateSpans.length === 1;
      if (derivesFromParent) {
        add('suffix', first.literal.text, node);
      } else {
        const source = escapeRegex(node.head.text) + node.templateSpans.map((span) => '.+' + escapeRegex(span.literal.text)).join('');
        add('pattern', source, node);
      }
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(expression);
}

function enclosingComponent(node: ts.Node): string | null {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isFunctionDeclaration(current) && current.name) return current.name.text;
    if (ts.isVariableDeclaration(current) && ts.isIdentifier(current.name)) return current.name.text;
  }
  return null;
}

export async function scanTestIds(checkout: Checkout) {
  const fromRepo = (file: string) => relativeTo(checkout.root, file);
  const definitions: TestIdDefinition[] = [];
  const missing: MissingTestId[] = [];

  const files = (await Promise.all(checkout.sourceDirs.map(listSourceFiles))).flat();
  for (const file of files) {
    const source = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const lineOf = (node: ts.Node) => source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
    const add = (kind: TestIdDefinition['kind'], value: string, node: ts.Node) =>
      definitions.push({ kind, value, file: fromRepo(file), line: lineOf(node) });

    const visit = (node: ts.Node) => {
      if (ts.isJsxAttribute(node) && TEST_ID_PROP.test(propName(node.name)) && node.initializer) {
        collectFromExpression(node.initializer, add);
      } else if (ts.isPropertyAssignment(node) && TEST_ID_PROP.test(propName(node.name))) {
        collectFromExpression(node.initializer, add);
      }

      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const element = node.tagName.getText();
        const props = node.attributes.properties;
        const names = props.filter(ts.isJsxAttribute).map((attribute) => propName(attribute.name));
        if (INTERACTIVE_PRIMITIVES.has(element) && !names.some((name) => TEST_ID_PROP.test(name))) {
          missing.push({
            file: fromRepo(file),
            line: lineOf(node),
            element,
            component: enclosingComponent(node),
            maybeViaSpread: props.some(ts.isJsxSpreadAttribute),
          });
        }
      }

      ts.forEachChild(node, visit);
    };
    visit(source);
  }

  return { definitions, missing };
}

// Tells whether an id used by a flow exists in the app: as an exact testID, as an
// instance of a dynamic one (`plan-card-<uuid>`), or as a known id plus the suffix a
// shared component appends (`weight-modal-save`, `exercise-form-sets-minus`).
export function createTestIdMatcher(definitions: TestIdDefinition[]) {
  const exact = new Set(definitions.filter((d) => d.kind === 'exact').map((d) => d.value));
  const patterns = [...new Set(definitions.filter((d) => d.kind === 'pattern').map((d) => d.value))].map(
    (source) => new RegExp(`^${source}$`)
  );
  const suffixes = [...new Set(definitions.filter((d) => d.kind === 'suffix').map((d) => d.value))].filter(Boolean);

  const exists = (id: string, depth = 0): boolean => {
    if (exact.has(id) || patterns.some((pattern) => pattern.test(id))) return true;
    if (depth >= 2) return false;
    return suffixes.some((suffix) => id.length > suffix.length && id.endsWith(suffix) && exists(id.slice(0, -suffix.length), depth + 1));
  };

  return { exact, exists };
}
