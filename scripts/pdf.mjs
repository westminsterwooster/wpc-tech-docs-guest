/**
 * Generates dist/pdf/document.pdf from the /print page.
 * On Vercel this runs as part of the build step.
 * Locally: npm run pdf
 *
 * Browser strategy:
 *   Linux (Vercel)  → puppeteer-core + @sparticuz/chromium
 *                     (@sparticuz bundles the shared libs missing on AL2)
 *   Windows (local) → full puppeteer devDependency with its bundled Chrome
 */

import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outputDir = resolve(root, 'dist', 'pdf');
const outputFile = resolve(outputDir, 'document.pdf');

const isWin = process.platform === 'win32';

// ── Start astro preview ────────────────────────────────────────────────────
const bin = isWin
  ? resolve(root, 'node_modules', '.bin', 'astro.cmd')
  : resolve(root, 'node_modules', '.bin', 'astro');

console.log('Starting preview server...');
const preview = isWin
  ? spawn('cmd.exe', ['/c', bin, 'preview'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  : spawn(bin, ['preview'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });

preview.stderr.on('data', d => process.stderr.write(d));

// Parse the actual URL from astro's output (handles dynamic port fallback)
const previewUrl = await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Preview server timed out')), 20000);
  const buf = [];
  preview.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text);
    buf.push(text);
    const all = buf.join('');
    const match = all.match(/(http:\/\/localhost:\d+)/);
    if (match) {
      clearTimeout(timeout);
      setTimeout(() => resolve(match[1]), 500);
    }
  });
  preview.on('error', reject);
  preview.on('exit', (code) => {
    if (code !== 0) reject(new Error(`Preview server exited with code ${code}`));
  });
});

// ── Generate PDF ───────────────────────────────────────────────────────────
async function runPdf(browser) {
  const page = await browser.newPage();

  // Letter content area at 96 CSS px/in: 8.5in - 2×0.75in margins = 7in = 672px.
  // Setting the viewport to this width ensures max-width:100% on images
  // maps exactly to the printable content width, preventing overflow/cropping.
  await page.setViewport({ width: 672, height: 912, deviceScaleFactor: 1 });

  console.log(`Navigating to ${previewUrl}/print/...`);
  await page.goto(`${previewUrl}/print/`, {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });

  // Hide the screen-only print bar before rendering
  await page.addStyleTag({
    content: '.print-bar { display: none !important; } body { padding-top: 0 !important; }',
  });

  // Force all images to load eagerly and wait for them to finish
  await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('img'));
    imgs.forEach(img => {
      img.loading = 'eager';
      img.decoding = 'sync';
    });
    await Promise.all(
      imgs.map(img =>
        img.complete
          ? Promise.resolve()
          : new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve;
            })
      )
    );
  });

  // Brief pause to let any remaining renders finish
  await new Promise(r => setTimeout(r, 1000));

  // Downsample images to their displayed dimensions at JPEG 75% quality.
  // This reduces the PDF from ~288MB to a manageable size.
  console.log('Compressing images...');
  await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('img'));
    for (const img of imgs) {
      const w = img.clientWidth;
      const h = img.clientHeight;
      // Skip images with no layout dimensions or that failed to load
      if (!w || !h || !img.complete || img.naturalWidth === 0) continue;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      img.src = dataUrl;
      await new Promise(r => { img.onload = r; img.onerror = r; });
    }
  });

  console.log('Generating PDF...');
  await page.pdf({
    path: outputFile,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size:8px;width:100%;text-align:center;color:#666;
                  font-family:'Segoe UI',sans-serif;padding:0 0.75in;">
        Westminster Presbyterian Church — Mackey Hall Technology Guide
      </div>`,
    footerTemplate: `
      <div style="font-size:8px;width:100%;text-align:center;color:#666;
                  font-family:'Segoe UI',sans-serif;">
        <span class="pageNumber"></span>&thinsp;/&thinsp;<span class="totalPages"></span>
      </div>`,
  });

  console.log(`\n✓ PDF saved to: ${outputFile}`);
}

try {
  await mkdir(outputDir, { recursive: true });

  console.log('Launching browser...');

  let browser;
  if (isWin) {
    // Local Windows: full puppeteer devDependency includes its own Chrome
    const { default: puppeteer } = await import('puppeteer');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } else {
    // Linux (Vercel): @sparticuz/chromium bundles the shared libs AL2 is missing
    const { default: chromium } = await import('@sparticuz/chromium');
    const { default: puppeteer } = await import('puppeteer-core');
    browser = await puppeteer.launch({
      headless: true,
      executablePath: await chromium.executablePath(),
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  await runPdf(browser);
  await browser.close();
} finally {
  preview.kill();
}
