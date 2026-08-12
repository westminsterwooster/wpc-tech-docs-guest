# Guest Documentation

Westminster Presbyterian Church guest technology documentation for Mackey Hall.

The site is built with Docusaurus and published as a single current documentation site.

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

## Publishing Workflow

The published site always serves the current docs from `docs/`. Changes merge through pull requests, and `docs/changelog.md` is updated automatically from merged GitHub pull requests.

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
