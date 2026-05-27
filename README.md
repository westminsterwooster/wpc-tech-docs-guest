# Guest Documentation

Westminster Presbyterian Church guest technology documentation for Mackey Hall.

The site is built with Docusaurus and published as documentation version `2026.05a`.

## Requirements

- Node.js 20 or newer
- npm

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

This checks local Markdown links and builds Docusaurus.

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

## Deployment

Any static host can serve the generated `build/` directory.

### Cloudflare Pages

Recommended settings:

- Build command: `bash cf-build.sh`
- Build output directory: `build`
- Node.js version: `20` or newer

The Cloudflare build script runs the full docs build.

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
npm run build:all
```
