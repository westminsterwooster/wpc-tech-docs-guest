import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, normalize, relative, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const version = '2026.05a';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = join(root, 'versioned_docs', `version-${version}`);
const sidebarPath = join(root, 'versioned_sidebars', `version-${version}-sidebars.json`);
const outputPath = join(root, 'static', `manual-${version}.pdf`);
const tempDir = join(root, 'build', 'pdf');
const tempMarkdown = join(tempDir, `manual-${version}.md`);

function flattenSidebar(items, docs = []) {
  for (const item of items) {
    if (typeof item === 'string') {
      docs.push(item);
    } else if (item.type === 'category') {
      if (item.link?.type === 'doc' && item.link.id) {
        docs.push(item.link.id);
      }
      flattenSidebar(item.items ?? [], docs);
    } else if (item.type === 'doc' && item.id) {
      docs.push(item.id);
    }
  }
  return [...new Set(docs)];
}

function docPathForId(id) {
  const base = join(docsRoot, `${id}.md`);
  const mdx = join(docsRoot, `${id}.mdx`);
  if (existsSync(base)) return base;
  if (existsSync(mdx)) return mdx;
  throw new Error(`PDF source document not found for sidebar id "${id}"`);
}

function stripFrontMatter(markdown) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}

function absolutizeMarkdownAssets(markdown, filePath) {
  const pageDir = dirname(filePath);
  return markdown.replace(/(!\[[^\]]*]\()([^):#][^)]+)(\))/g, (match, open, target, close) => {
    if (/^(?:https?:|mailto:|\/)/.test(target)) return match;
    const [pathPart, suffix = ''] = target.split(/(?=[#?])/);
    const absolute = normalize(join(pageDir, pathPart));
    const docsRelative = relative(docsRoot, absolute).replaceAll('\\', '/');
    return `${open}${docsRelative}${suffix}${close}`;
  });
}

function normalizeDocusaurusMarkdown(markdown) {
  return markdown
    .replace(/^:::(note|tip|info|warning|danger)(?:[ \t]+(.+))?$/gm, (_match, kind, title) => {
      const label = title ? `${kind.toUpperCase()}: ${title}` : kind.toUpperCase();
      return `> **${label}**`;
    })
    .replace(/^:::$/gm, '')
    .replace(/\.md(?=[)#?])/g, '');
}

function pandocArgs() {
  const engine = process.env.PANDOC_PDF_ENGINE ?? 'xelatex';
  return [
    tempMarkdown,
    '--from',
    'gfm+yaml_metadata_block',
    '--toc',
    '--toc-depth=3',
    '--number-sections',
    '--resource-path',
    docsRoot,
    '--pdf-engine',
    engine,
    '--metadata',
    'title=Guest Documentation',
    '--metadata',
    'subtitle=Westminster Presbyterian Church - Mackey Hall Technology',
    '--metadata',
    `version=${version}`,
    '-o',
    outputPath
  ];
}

function escapePdfText(value) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function cleanMarkdownForFallback(markdown) {
  return markdown
    .replace(/!\[([^\]]*)]\([^)]+\)/g, 'Image: $1')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\r/g, '');
}

function wrapLine(line, maxChars = 92) {
  const words = line.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current ? current.length + 1 : 0) + word.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

function writeFallbackPdf(markdown) {
  const textLines = cleanMarkdownForFallback(markdown)
    .split('\n')
    .flatMap((line) => wrapLine(line.trimEnd()));
  const pages = [];
  const linesPerPage = 48;
  for (let i = 0; i < textLines.length; i += linesPerPage) {
    pages.push(textLines.slice(i, i + linesPerPage));
  }

  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageIds = [];
  for (const pageLines of pages) {
    const content = [
      'BT',
      '/F1 10 Tf',
      '50 760 Td',
      '14 TL',
      ...pageLines.map((line, index) =>
        `${index === 0 ? '' : 'T* ' }(${escapePdfText(line)}) Tj`
      ),
      'ET'
    ].join('\n');
    const contentId = addObject(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
    const pageId = addObject(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  }

  const pagesId = addObject(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
  for (const pageId of pageIds) {
    objects[pageId - 1] = objects[pageId - 1].replace('/Parent 0 0 R', `/Parent ${pagesId} 0 R`);
  }
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  writeFileSync(outputPath, pdf, 'binary');
  console.warn('Pandoc was not found. Wrote a text-only fallback PDF; install Pandoc and a PDF engine for the full manual.');
}

if (!existsSync(sidebarPath)) {
  throw new Error(`Versioned sidebar file not found: ${sidebarPath}`);
}

const sidebar = JSON.parse(readFileSync(sidebarPath, 'utf8'));
const docIds = flattenSidebar(sidebar.docsSidebar ?? []);
const sections = docIds.map((id) => {
  const filePath = docPathForId(id);
  const markdown = normalizeDocusaurusMarkdown(
    absolutizeMarkdownAssets(stripFrontMatter(readFileSync(filePath, 'utf8')), filePath)
  );
  return `\n\n\\newpage\n\n${markdown.trim()}\n`;
});

mkdirSync(tempDir, {recursive: true});
mkdirSync(dirname(outputPath), {recursive: true});
writeFileSync(
  tempMarkdown,
  [
    '---',
    'title: Guest Documentation',
    'subtitle: Westminster Presbyterian Church - Mackey Hall Technology',
    `date: Version ${version}`,
    '---',
    ...sections
  ].join('\n'),
  'utf8'
);

const result = spawnSync('pandoc', pandocArgs(), {stdio: 'inherit', shell: process.platform === 'win32'});
if (result.error) {
  if (result.error.code === 'ENOENT') {
    writeFallbackPdf(readFileSync(tempMarkdown, 'utf8'));
    process.exit(0);
  }
  throw result.error;
}
if (result.status !== 0) {
  if (result.status === 1 && process.platform === 'win32') {
    writeFallbackPdf(readFileSync(tempMarkdown, 'utf8'));
    process.exit(0);
  }
  throw new Error(`pandoc exited with status ${result.status}`);
}

console.log(`PDF written to ${outputPath}`);
