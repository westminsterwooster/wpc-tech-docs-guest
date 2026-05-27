import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {dirname, extname, join, resolve} from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const docsRoots = [
  join(root, 'docs'),
  join(root, 'versioned_docs', 'version-2026.05a')
];
const markdownExtensions = new Set(['.md', '.mdx']);
const problems = [];

function walk(dir) {
  const entries = readdirSync(dir, {withFileTypes: true});
  return entries.flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return markdownExtensions.has(extname(entry.name)) ? [path] : [];
  });
}

function withoutHashOrQuery(value) {
  return value.split('#')[0].split('?')[0];
}

function checkTarget(file, target) {
  if (!target || /^(?:https?:|mailto:|tel:|#|\/)/.test(target)) return;
  const cleanTarget = decodeURIComponent(withoutHashOrQuery(target));
  if (!cleanTarget) return;
  const absolute = resolve(dirname(file), cleanTarget);
  const candidates = extname(absolute)
    ? [absolute]
    : [`${absolute}.md`, `${absolute}.mdx`, join(absolute, 'index.md'), join(absolute, 'index.mdx')];
  if (!candidates.some((candidate) => existsSync(candidate))) {
    problems.push(`${file}: missing target ${target}`);
  }
}

for (const docsRoot of docsRoots) {
  if (!existsSync(docsRoot)) continue;
  for (const file of walk(docsRoot)) {
    const markdown = readFileSync(file, 'utf8');
    for (const match of markdown.matchAll(/!?\[[^\]]*]\(([^)]+)\)/g)) {
      checkTarget(file, match[1].trim());
    }
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}

console.log('Markdown links and local assets look good.');
