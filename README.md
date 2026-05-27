# Guest Documentation

Westminster Presbyterian Church guest technology documentation for Mackey Hall.

The site is built with Docusaurus and published as documentation version `2026.05a`.

## Requirements

- Node.js 20 or newer
- npm
- Pandoc for PDF generation
- A Pandoc PDF engine such as XeLaTeX, LuaLaTeX, or another configured engine

## Install

```bash
npm install
```

## Local Development

```bash
npm run start
```

The local site runs at `http://localhost:3000`.

## Build

```bash
npm run build
```

The static site is written to `build/`.

For a full validation and release-style build:

```bash
npm run build:all
```

This checks local Markdown links, builds Docusaurus, and generates the PDF manual.

## Versioning Workflow

The current published docs are versioned as `2026.05a` using Docusaurus versioning:

- Source docs remain in `docs/`.
- Published versioned docs live in `versioned_docs/version-2026.05a/`.
- Versioned sidebars live in `versioned_sidebars/version-2026.05a-sidebars.json`.
- `versions.json` controls the visible versions.

To create a future version after updating `docs/`:

```bash
npm run docs:version -- NEW_VERSION
```

The `2026.05a` version has already been created for this migration.

## PDF Manual

Generate the printable manual with:

```bash
npm run docs:pdf
```

The PDF pipeline uses Pandoc and follows the versioned sidebar order. Output is written to:

```text
static/manual-2026.05a.pdf
```

That file is copied into the Docusaurus build and is publicly available at `/manual-2026.05a.pdf`.

If your machine uses a PDF engine other than XeLaTeX, set:

```bash
PANDOC_PDF_ENGINE=lualatex npm run docs:pdf
```

On Windows PowerShell:

```powershell
$env:PANDOC_PDF_ENGINE = "lualatex"
npm run docs:pdf
```

## Deployment

Any static host can serve the generated `build/` directory.

### Cloudflare Pages

Recommended settings:

- Build command: `bash cf-build.sh`
- Build output directory: `build`
- Node.js version: `20` or newer

The Cloudflare build script downloads pinned Linux builds of Pandoc and Tectonic, sets Tectonic as the PDF engine, then runs the full docs build. If Cloudflare does not need to regenerate the PDF during deployment, use `npm run docs:check-links && npm run build` instead.

### GitHub Pages or Generic Static Hosting

Run:

```bash
npm run build:all
```

Then publish the `build/` directory.

## Useful Commands

```bash
npm run start
npm run build
npm run serve
npm run docs:check-links
npm run docs:pdf
npm run build:all
```
