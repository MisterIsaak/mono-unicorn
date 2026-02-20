# Unicorn

Vue 3.6 monorepo with a shared component library, Storybook, and web application.

## Prerequisites

- **Node.js 24.10+** — managed automatically by pnpm via `useNodeVersion`
- **pnpm 10+** — via Corepack: `corepack enable`
- **Windows**: Developer mode enabled (required for pnpm symlinks)

> Corepack on Windows `.msi` Node installations may require removing existing Corepack shims via Windows app settings.

## Getting started

```sh
corepack enable
pnpm install
pnpm dev
```

## Project structure

```
apps/
  web/          — Main web application (@unicorn/web)
  storybook/    — Component explorer (@unicorn/storybook)
packages/
  ui/           — Shared component library (@unicorn/ui)
```

`@unicorn/web` and `@unicorn/storybook` both depend on `@unicorn/ui`.

## Turbo (task runner)

This repo uses Turbo to orchestrate tasks across the monorepo.

- `pnpm dev` runs `turbo dev` to start package dev servers.
- `pnpm build` runs `turbo build` with dependency ordering (`^build` means build upstream dependencies first).
- `outputs` in `turbo.json` define cacheable build artifacts (`dist/**`, `storybook-static/**`).
- `dev` is marked `persistent` and `cache: false` because dev servers are long-running and not cacheable.

## Knip (unused code detection)

This repo uses Knip to detect unused files, exports, and dependencies across the monorepo.

- `pnpm repo:check` runs Knip with [knip.json](knip.json) as the source of workspace config.
- Entries target production code paths, while tests and `env.d.ts` are ignored to reduce noise.
- Use Knip before merging large refactors to keep the dependency graph clean.

## TypeScript (project references)

This repo uses `vue-tsc --build` with composite project references for cross-package type checking.

- Three root base configs provide shared settings: `tsconfig.app.json` (browser apps), `tsconfig.lib.json` (published libraries), and `tsconfig.node.json` (config files like `vite.config.ts`).
- Each package has a references-only `tsconfig.json` pointing to its specific configs (e.g. `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.vitest.json`).
- Sub-package configs extend the root bases and only add package-specific settings (`tsBuildInfoFile`, `include`, `paths`).
- All root base configs set `composite: true`, which enables incremental builds and is required for project references. Sub-packages inherit this automatically.
- `lib` is set to `ESNext` + `DOM` in the app and lib base configs. This allows use of the latest JS APIs (e.g. `Object.groupBy()`, `Promise.withResolvers()`). Vite's `build.target: 'esnext'` matches this by skipping syntax transpilation. If you later need to support older browsers, lower both the TypeScript `lib` and Vite `build.target` together.
- `pnpm type-check` builds the full project reference graph from the root `tsconfig.json`.

## Linting and formatting

This repo uses OxLint, ESLint, and Oxfmt for code quality and formatting. All configuration lives at the root — workspace packages inherit it automatically.

- **OxLint** (`.oxlintrc.json`) runs first for fast checks. Categories: `correctness` (error), `suspicious` (warn), `pedantic` (warn). Plugins: `eslint`, `typescript`, `unicorn`, `oxc`, `vue`.
- **ESLint** (`eslint.config.ts`) runs second for Vue/TypeScript-specific rules and Vitest test linting. Each workspace re-exports the root config.
- **Oxfmt** (`.oxfmtrc.json`) handles formatting: no semicolons, single quotes. Replaces Prettier. Import sorting is enabled — `@unicorn/` imports are classified as internal.
- `eslint-plugin-oxlint` disables ESLint rules already covered by OxLint to avoid duplicate reports.
- Pre-commit hooks via `lint-staged` run `oxlint --fix` → `eslint --fix` → `oxfmt` on staged files.
- Full linting runs from the root only (`pnpm lint`), not per-package.

## Storybook

Browse components in isolation:

```sh
pnpm --filter @unicorn/storybook dev
```

Opens on [http://localhost:6006](http://localhost:6006).

## Available scripts

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `pnpm dev`          | Start all dev servers             |
| `pnpm build`        | Build all packages                |
| `pnpm lint`         | Run OxLint + ESLint (check mode)  |
| `pnpm lint:fix`     | Run OxLint + ESLint with auto-fix |
| `pnpm test`         | Run Vitest across all packages    |
| `pnpm type-check`   | Run vue-tsc --build               |
| `pnpm format`       | Format with Oxfmt                 |
| `pnpm format:check` | Check formatting (CI)             |
| `pnpm repo:check`   | Run knip (unused code detection)  |

## IDE setup

Recommended VS Code extensions are auto-suggested via `.vscode/extensions.json`:

- **Vue - Official (Volar)** — Vue language support
- **ESLint** — Lint integration
- **OXC** — OxLint and Oxfmt integration
- **Vitest Explorer** — Test runner integration
- **EditorConfig** — Consistent editor settings

Use `vue-tsc` for command-line type checking (`pnpm type-check`).
