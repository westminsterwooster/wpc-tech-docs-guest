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

## Automated Dependency Fixes

The **NPM Audit Fix** GitHub Actions workflow runs daily at 00:00 UTC and can also
be started manually from the Actions tab. It uses Node.js 24 LTS and its bundled
npm, runs `npm ci` followed by `npm run audit-fix`, and validates the result with
optional tests, type checking, and the full build before opening or updating
`chore/npm-audit-fix`. Only `package.json` and `package-lock.json` are included.

The audit command does not use `--force`. Remaining vulnerabilities can cause npm
to exit nonzero even after applying fixes; the workflow reports this in its logs
and PR body so that safe fixes can still be reviewed. Failed validation blocks
PR creation. Runs with no dependency changes do not create a PR.

The PR step uses the `NPM_AUDIT_FIX_TOKEN` Actions secret. Store a fine-grained
personal access token with access to this repository and **Contents: Read and
write** and **Pull requests: Read and write** permissions. Obtain organization
approval if required, and renew the secret before the token expires. Using this
token allows automated PRs to trigger the repository's pull-request workflows.

## Useful Commands

```bash
npm run start
npm run build
npm run serve
npm run docs:check-links
npm run build:all
```
