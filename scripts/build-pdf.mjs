import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { createRequire } from "node:module";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import sharp from "sharp";
import { installPdfBrowser } from "./install-pdf-browser.mjs";

const host = "127.0.0.1";
const docsPath = process.env.PDF_DOCS_PATH ?? "/docs";
const siteUrl = process.env.PDF_SITE_URL ?? "https://docs.wpctech.info";
const pdfPath = resolve(process.env.PDF_OUTPUT ?? "static/guest-documentation.pdf");
const buildDir = resolve(process.env.PDF_BUILD_DIR ?? "build");
const imageCacheDir = resolve(process.env.PDF_IMAGE_CACHE_DIR ?? ".cache/pdf-images");
const coverImagePath = resolve(process.env.PDF_COVER_IMAGE ?? ".cache/guest-documentation-cover.png");
const pdfMarginMm = process.env.PDF_MARGIN_MM ?? "12";
const pageConcurrency = process.env.PDF_PAGE_CONCURRENCY ?? "4";
const imageMaxWidth = Number(process.env.PDF_IMAGE_MAX_WIDTH ?? 1400);
const imageQuality = Number(process.env.PDF_IMAGE_QUALITY ?? 68);
const npx = "npx";
const require = createRequire(import.meta.url);
const pdfCliPath = require.resolve("docusaurus-docs-to-pdf/dist/main.js");
const pdfHtmlPath = require.resolve("docusaurus-docs-to-pdf/dist/html.js");

const printCss = `
.pdf-cover {
  background: #ffffff !important;
}

.navbar,
.footer,
.theme-doc-sidebar-container,
.theme-doc-toc-desktop,
.theme-doc-breadcrumbs,
.theme-edit-this-page,
.theme-last-updated,
.pagination-nav {
  display: none !important;
}

.main-wrapper,
.container {
  max-width: none !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}

.markdown img {
  break-inside: avoid;
  max-height: 8.5in;
}
`;

function patchPdfGenerator() {
  const mainSource = readFileSync(pdfCliPath, "utf8");
  const patchedMainSource = mainSource.replace(
    "(0, html_1.generateTocHtml)(sidebarItems, 'ç›®å½•')",
    "(0, html_1.generateTocHtml)(sidebarItems, 'Table of Contents')",
  );
  if (patchedMainSource !== mainSource) {
    writeFileSync(pdfCliPath, patchedMainSource);
  }

  const htmlSource = readFileSync(pdfHtmlPath, "utf8");
  const patchedHtmlSource = htmlSource
    .replace(
      '<a href="#${item.id}"><span>${item.title}</span></a>',
      '<a href="#${item.id}"><span class="toc-label">${item.title}</span><span class="toc-page" data-target="#${item.id}"></span></a>',
    )
    .replace(
      `.docusaurus-toc-body a::after {
                    content: "";
                    flex-grow: 1;
                    border-bottom: 1.2pt dotted #bbb;
                    margin-left: 8pt;
                    order: 2;
                }

                .docusaurus-toc-body a span {
                    order: 1;
                    max-width: 88%;
                    line-height: 1.3;
                }`,
      `.docusaurus-toc-body a::after {
                    content: "";
                    flex-grow: 1;
                    border-bottom: 1.2pt dotted #bbb;
                    margin-left: 8pt;
                    margin-right: 8pt;
                    order: 2;
                }

                .docusaurus-toc-body a span.toc-label {
                    order: 1;
                    max-width: 82%;
                    line-height: 1.3;
                }

                .docusaurus-toc-body a span.toc-page {
                    order: 3;
                    min-width: 20pt;
                    text-align: right;
                }

                .docusaurus-toc-body a span.toc-page::after {
                    content: target-counter(attr(data-target), page);
                }`,
    );
  if (patchedHtmlSource !== htmlSource) {
    writeFileSync(pdfHtmlPath, patchedHtmlSource);
  }
}

async function createCoverImage() {
  const logoPath = resolve("static/img/WPC_logo.png");
  const bannerPath = resolve("static/img/banner.png");
  const [logoDataUrl, bannerDataUrl] = await Promise.all([
    sharp(logoPath)
      .resize({ width: 190, withoutEnlargement: true })
      .png()
      .toBuffer()
      .then((buffer) => `data:image/png;base64,${buffer.toString("base64")}`),
    sharp(bannerPath)
      .resize({ width: 1240, height: 1754, fit: "cover" })
      .jpeg({ quality: 74, mozjpeg: true })
      .toBuffer()
      .then((buffer) => `data:image/jpeg;base64,${buffer.toString("base64")}`),
  ]);

  const generatedOn = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(new Date());

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1754" viewBox="0 0 1240 1754">
    <rect width="1240" height="1754" fill="#ffffff"/>
    <image href="${bannerDataUrl}" width="1240" height="1754" preserveAspectRatio="xMidYMid slice"/>
    <rect width="1240" height="1754" fill="rgba(11, 18, 32, 0.70)"/>
    <rect x="96" y="96" width="1048" height="1562" fill="rgba(255,255,255,0.93)"/>
    <image href="${logoDataUrl}" x="96" y="132" width="190" height="190" preserveAspectRatio="xMidYMid meet"/>
    <text x="96" y="520" font-family="Arial, Helvetica, sans-serif" font-size="78" font-weight="700" fill="#111827">Guest Documentation</text>
    <text x="96" y="604" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#374151">Westminster Presbyterian Church</text>
    <text x="96" y="656" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#374151">Mackey Hall Technology</text>
    <line x1="96" y1="744" x2="820" y2="744" stroke="#3f51b5" stroke-width="8"/>
    <text x="96" y="850" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#111827">Printable operating guide for video, projector, sound,</text>
    <text x="96" y="896" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#111827">computer audio, Bluetooth, and microphone systems.</text>
    <text x="96" y="1492" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#4b5563">Current online edition</text>
    <text x="96" y="1532" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#4b5563">Generated ${generatedOn}</text>
    <text x="96" y="1572" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#4b5563">docs.wpctech.info</text>
  </svg>`;

  mkdirSync(dirname(coverImagePath), { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(coverImagePath);
  return coverImagePath;
}

function drawTocEntry(page, fonts, item, y, pageWidth) {
  const indent = item.level * 20;
  const x = 62 + indent;
  const pageNumberX = pageWidth - 72;
  const titleSize = item.level === 0 ? 14 : item.level === 1 ? 12 : 11;
  const titleFont = item.bold ? fonts.bold : fonts.regular;
  const textColor = item.level >= 2 ? rgb(0.2, 0.2, 0.2) : rgb(0, 0, 0);
  const titleWidth = titleFont.widthOfTextAtSize(item.title, titleSize);
  const numberText = String(item.page);
  const numberWidth = fonts.regular.widthOfTextAtSize(numberText, 11);
  const dotsStart = x + titleWidth + 8;
  const dotsEnd = pageNumberX - numberWidth - 8;
  const dotWidth = fonts.regular.widthOfTextAtSize(".", 9);
  const dotCount = Math.max(0, Math.floor((dotsEnd - dotsStart) / dotWidth));

  page.drawText(item.title, {
    x,
    y,
    size: titleSize,
    font: titleFont,
    color: textColor,
  });
  page.drawText(".".repeat(dotCount), {
    x: dotsStart,
    y: y + 1,
    size: 9,
    font: fonts.regular,
    color: rgb(0.62, 0.62, 0.62),
  });
  page.drawText(numberText, {
    x: pageNumberX - numberWidth,
    y,
    size: 11,
    font: fonts.regular,
    color: textColor,
  });
}

async function drawCoverPage(page, fonts, pageWidth, pageHeight) {
  const bannerImage = await sharp(resolve("static/img/banner.png"))
    .resize({ width: 1200, height: 1700, fit: "cover" })
    .jpeg({ quality: 74, mozjpeg: true })
    .toBuffer();
  const logoImage = await sharp(resolve("static/img/WPC_logo.png"))
    .resize({ width: 190, withoutEnlargement: true })
    .png()
    .toBuffer();
  const background = await page.doc.embedJpg(bannerImage);
  const logo = await page.doc.embedPng(logoImage);
  const panelX = 46;
  const panelY = 46;
  const panelWidth = pageWidth - 92;
  const panelHeight = pageHeight - 92;
  const contentX = panelX + 32;

  page.drawImage(background, { x: 0, y: 0, width: pageWidth, height: pageHeight });
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(0.043, 0.071, 0.125),
    opacity: 0.7,
  });
  page.drawRectangle({
    x: panelX,
    y: panelY,
    width: panelWidth,
    height: panelHeight,
    color: rgb(1, 1, 1),
    opacity: 0.94,
  });
  page.drawImage(logo, {
    x: contentX,
    y: pageHeight - 150,
    width: 92,
    height: 92,
  });
  page.drawText("Guest Documentation", {
    x: contentX,
    y: pageHeight - 255,
    size: 38,
    font: fonts.bold,
    color: rgb(0.067, 0.094, 0.153),
  });
  page.drawText("Westminster Presbyterian Church", {
    x: contentX,
    y: pageHeight - 295,
    size: 17,
    font: fonts.regular,
    color: rgb(0.22, 0.255, 0.318),
  });
  page.drawText("Mackey Hall Technology", {
    x: contentX,
    y: pageHeight - 322,
    size: 17,
    font: fonts.regular,
    color: rgb(0.22, 0.255, 0.318),
  });
  page.drawLine({
    start: { x: contentX, y: pageHeight - 370 },
    end: { x: contentX + 350, y: pageHeight - 370 },
    thickness: 4,
    color: rgb(0.247, 0.318, 0.71),
  });
  page.drawText("Printable operating guide for video, projector, sound,", {
    x: contentX,
    y: pageHeight - 425,
    size: 15,
    font: fonts.regular,
    color: rgb(0.067, 0.094, 0.153),
  });
  page.drawText("computer audio, Bluetooth, and microphone systems.", {
    x: contentX,
    y: pageHeight - 449,
    size: 15,
    font: fonts.regular,
    color: rgb(0.067, 0.094, 0.153),
  });

  const generatedOn = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(new Date());
  page.drawText("Current online edition", {
    x: contentX,
    y: panelY + 76,
    size: 12,
    font: fonts.regular,
    color: rgb(0.294, 0.333, 0.404),
  });
  page.drawText(`Generated ${generatedOn}`, {
    x: contentX,
    y: panelY + 54,
    size: 12,
    font: fonts.regular,
    color: rgb(0.294, 0.333, 0.404),
  });
  page.drawText("docs.wpctech.info", {
    x: contentX,
    y: panelY + 32,
    size: 12,
    font: fonts.regular,
    color: rgb(0.294, 0.333, 0.404),
  });
}

async function replacePdfFrontMatter(pdfFilePath) {
  const rawPdf = await PDFDocument.load(readFileSync(pdfFilePath));
  const finalPdf = await PDFDocument.create();
  const regular = await finalPdf.embedFont(StandardFonts.Helvetica);
  const bold = await finalPdf.embedFont(StandardFonts.HelveticaBold);
  const fonts = { regular, bold };
  const [firstRawPage] = rawPdf.getPages();
  const { width, height } = firstRawPage.getSize();
  const totalPages = rawPdf.getPageCount();

  const coverPage = finalPdf.addPage([width, height]);
  await drawCoverPage(coverPage, fonts, width, height);

  const tocPage = finalPdf.addPage([width, height]);
  tocPage.drawText("Table of Contents", {
    x: 54,
    y: height - 104,
    size: 34,
    font: bold,
    color: rgb(0, 0, 0),
  });
  tocPage.drawLine({
    start: { x: 54, y: height - 128 },
    end: { x: width - 54, y: height - 128 },
    thickness: 2,
    color: rgb(0, 0, 0),
  });

  const tocItems = [
    { title: "Home", page: 3, level: 0 },
    { title: "Documentation", page: 5, level: 0, bold: true },
    { title: "Video", page: 5, level: 1, bold: true },
    { title: "Lowering Projector Screen", page: 5, level: 2 },
    { title: "Retracting Projector Screen", page: 7, level: 2 },
    { title: "Turning Projector / Rear TV On", page: 9, level: 2 },
    { title: "Turning Projector / Rear TV Off", page: 12, level: 2 },
    { title: "Computer Input Methods", page: 15, level: 2 },
    { title: "Audio", page: 22, level: 1, bold: true },
    { title: "Turning the Sound System On", page: 22, level: 2 },
    { title: "Using Audio Controls", page: 25, level: 2 },
    { title: "Using Computer Audio", page: 30, level: 2 },
    { title: "Bluetooth Pairing", page: 33, level: 2 },
    { title: "Connecting and Using Microphones", page: 36, level: 2 },
    { title: "About", page: 45, level: 0 },
    { title: "Changelog", page: 46, level: 0 },
  ];

  let y = height - 178;
  for (const item of tocItems) {
    drawTocEntry(tocPage, fonts, item, y, width);
    y -= item.level === 0 ? 38 : 30;
  }

  const footerText = `2 / ${totalPages}`;
  tocPage.drawText(footerText, {
    x: (width - regular.widthOfTextAtSize(footerText, 8)) / 2,
    y: 18,
    size: 8,
    font: regular,
    color: rgb(0, 0, 0),
  });

  const contentPages = await finalPdf.copyPages(
    rawPdf,
    Array.from({ length: rawPdf.getPageCount() - 2 }, (_, index) => index + 2),
  );
  for (const page of contentPages) {
    finalPdf.addPage(page);
  }

  writeFileSync(pdfFilePath, await finalPdf.save());
}

function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      ...options,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolveRun();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
      }
    });
  });
}

function getAvailablePort() {
  if (process.env.PDF_DOCS_PORT) {
    return Promise.resolve(Number(process.env.PDF_DOCS_PORT));
  }

  return new Promise((resolvePort, reject) => {
    const server = createNetServer();
    server.on("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") {
          resolvePort(address.port);
        } else {
          reject(new Error("Could not allocate a local port"));
        }
      });
    });
  });
}

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

const compressibleImageExtensions = new Set([".jpeg", ".jpg", ".png", ".webp"]);

function resolveBuildPath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0]);
  const relativePath = normalize(decodedPath.replace(/^\/+/, ""));
  if (relativePath.startsWith("..") || relativePath.includes(`..${sep}`)) {
    return null;
  }

  const candidates = [];
  const basePath = join(buildDir, relativePath);
  candidates.push(basePath);
  candidates.push(`${basePath}.html`);
  if (!extname(basePath)) {
    candidates.push(join(basePath, "index.html"));
  }
  if (decodedPath === "/") {
    candidates.unshift(join(buildDir, "index.html"));
  }

  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
}

async function getPdfImagePath(filePath) {
  const extension = extname(filePath).toLowerCase();
  if (!compressibleImageExtensions.has(extension)) {
    return { filePath, contentType: mimeTypes.get(extension) };
  }

  const stats = statSync(filePath);
  const cacheKey = createHash("sha256")
    .update(filePath)
    .update(String(stats.mtimeMs))
    .update(String(stats.size))
    .update(String(imageMaxWidth))
    .update(String(imageQuality))
    .digest("hex");
  const cachedPath = join(imageCacheDir, `${cacheKey}.jpg`);

  if (!existsSync(cachedPath)) {
    mkdirSync(imageCacheDir, { recursive: true });
    await sharp(filePath)
      .rotate()
      .resize({
        width: imageMaxWidth,
        height: imageMaxWidth,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: imageQuality, mozjpeg: true })
      .toFile(cachedPath);
  }

  return { filePath: cachedPath, contentType: "image/jpeg" };
}

function startStaticServer(port) {
  const server = createHttpServer(async (request, response) => {
    const filePath = resolveBuildPath(request.url ?? "/");
    if (!filePath) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const asset = await getPdfImagePath(filePath);
    response.writeHead(200, {
      "content-type": asset.contentType ?? "application/octet-stream",
    });
    createReadStream(asset.filePath).pipe(response);
  });

  return new Promise((resolveServer, reject) => {
    server.on("error", reject);
    server.listen(port, host, () => resolveServer(server));
  });
}

async function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until the static server is ready.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

mkdirSync(dirname(pdfPath), { recursive: true });

const port = await getAvailablePort();
const origin = `http://${host}:${port}`;
const docsUrl = new URL(docsPath, origin).toString();
const server = await startStaticServer(port);

try {
  await installPdfBrowser();
  patchPdfGenerator();
  const pdfCoverImage = await createCoverImage();
  await waitForServer(docsUrl);
  await run(process.execPath, [
    pdfCliPath,
    "--docs-url",
    docsUrl,
    "--pdf-path",
    pdfPath,
    "--pdf-cover-image",
    pdfCoverImage,
    "--pdf-margin-mm",
    pdfMarginMm,
    "--page-concurrency",
    pageConcurrency,
    "--site-rewrite",
    `${origin}=${siteUrl}`,
    "--css",
    printCss,
  ], { shell: false });
  await replacePdfFrontMatter(pdfPath);
  if (!existsSync(pdfPath) || statSync(pdfPath).size === 0) {
    throw new Error(
      `PDF was not created at ${pdfPath}. Run "npm run pdf:install-browser" if Puppeteer Chrome is missing.`,
    );
  }
  console.log(`Generated PDF at ${pdfPath}`);
} finally {
  server.close();
}
